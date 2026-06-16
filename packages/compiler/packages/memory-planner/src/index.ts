import type {
	CompilerASTLine,
	MemoryDeclarationLine,
	MemoryLayoutPlan,
	MemoryRegionIdentity,
	ModuleLine,
	PlannedMemoryDeclaration,
	PlannedMemoryDeclarationSource,
	PlannedMemoryModule,
	RegionLine,
	ShapeLine,
} from '@8f4e/language-spec';
import {
	ArgumentType,
	ErrorCode,
	type ErrorCodeValue,
	GLOBAL_ALIGNMENT_BOUNDARY,
	getDefaultMemoryRegion,
	getMemoryRegionByIndex,
	getMemoryRegionByName,
	isMemoryDeclarationLine,
	isScalarMemoryDeclarationLine,
} from '@8f4e/language-spec';
import { planArrayDeclarationLayout, planScalarDeclarationLayout } from './declarations';
import { advanceModuleByteAddress, createModuleAddressCursor, getNextModuleByteAddress } from './modules';

export type {
	MemoryLayoutPlan,
	MemoryRegionIdentity,
	PlannedMemoryDeclaration,
	PlannedMemoryDeclarationSource,
	PlannedMemoryModule,
} from '@8f4e/language-spec';

interface MemoryPlannerErrorDetails {
	identifier?: string;
	reason?: string;
}

export class MemoryPlannerError extends Error {
	readonly compilerErrorCode: ErrorCodeValue;
	readonly line: CompilerASTLine;
	readonly details?: MemoryPlannerErrorDetails;

	constructor(
		compilerErrorCode: ErrorCodeValue,
		line: CompilerASTLine,
		message: string,
		details?: MemoryPlannerErrorDetails
	) {
		super(message);
		this.name = 'MemoryPlannerError';
		this.compilerErrorCode = compilerErrorCode;
		this.line = line;
		this.details = details;
	}
}

export interface MemoryLayoutSourcePrototype {
	id: string;
	memoryDeclarationLines: readonly MemoryDeclarationLine[];
}

export type MemoryLayoutSourceLine = MemoryDeclarationLine | ShapeLine;

export interface MemoryLayoutSourceModule {
	id: string;
	moduleLine: Pick<ModuleLine, 'lineNumber'>;
	regionLine?: Pick<RegionLine, 'arguments'>;
	lines: readonly MemoryLayoutSourceLine[];
}

export interface MemoryLayoutPlanInput {
	prototypes: readonly MemoryLayoutSourcePrototype[];
	modules: readonly MemoryLayoutSourceModule[];
	startingByteAddress?: number;
	memoryRegions?: readonly string[];
}

function plannerError(
	compilerErrorCode: ErrorCodeValue,
	line: CompilerASTLine,
	message: string,
	details?: MemoryPlannerErrorDetails
): MemoryPlannerError {
	return new MemoryPlannerError(compilerErrorCode, line, message, details);
}

function getModuleRegion(ast: MemoryLayoutSourceModule, memoryRegions: readonly string[]): MemoryRegionIdentity {
	const regionLine = ast.regionLine;
	if (!regionLine) {
		return getDefaultMemoryRegion();
	}

	const [argument] = regionLine.arguments;
	if (argument.type === ArgumentType.LITERAL) {
		return getMemoryRegionByIndex(argument.value, memoryRegions);
	}

	return getMemoryRegionByName(argument.value, memoryRegions);
}

function getScalarDeclarationId(line: MemoryDeclarationLine): string {
	const [firstArgument] = line.arguments;
	if (!firstArgument) {
		return '__anonymous__' + line.lineNumber;
	}

	if (firstArgument.type !== ArgumentType.IDENTIFIER || firstArgument.referenceKind !== 'plain') {
		return '__anonymous__' + line.lineNumber;
	}

	return firstArgument.value;
}

function getPrototypeMap(
	prototypes: readonly MemoryLayoutSourcePrototype[]
): Readonly<Record<string, MemoryLayoutSourcePrototype>> {
	return Object.fromEntries(prototypes.map(prototype => [prototype.id, prototype]));
}

function getEffectiveMemoryDeclarationSources(
	sourceModule: MemoryLayoutSourceModule,
	prototypesById: Readonly<Record<string, MemoryLayoutSourcePrototype>>
): PlannedMemoryDeclarationSource[] {
	const declarationSources: PlannedMemoryDeclarationSource[] = [];

	for (const line of sourceModule.lines) {
		if (isMemoryDeclarationLine(line)) {
			declarationSources.push({ line, isInherited: false });
			continue;
		}

		const prototypeId = line.arguments[0].value;
		const prototype = prototypesById[prototypeId];
		if (!prototype) {
			throw plannerError(ErrorCode.UNDECLARED_IDENTIFIER, line, 'Unknown prototype shape in memory layout.', {
				identifier: prototypeId,
			});
		}

		for (const declarationLine of prototype.memoryDeclarationLines) {
			declarationSources.push({
				line: {
					...declarationLine,
					lineNumber: line.lineNumber,
				},
				isInherited: true,
			});
		}
	}

	return declarationSources;
}

function planDeclarationLine(
	line: MemoryDeclarationLine,
	startingByteAddress: number,
	localWordOffset: number,
	region: MemoryRegionIdentity
) {
	if (isScalarMemoryDeclarationLine(line)) {
		return planScalarDeclarationLayout({
			id: getScalarDeclarationId(line),
			lineNumber: line.lineNumber,
			instruction: line.instruction,
			startingByteAddress,
			localWordOffset,
			region,
		});
	}

	const elementCountArgument = line.arguments[1] as { value: number };
	return planArrayDeclarationLayout({
		id: line.arguments[0].value,
		lineNumber: line.lineNumber,
		instruction: line.instruction,
		numberOfElements: elementCountArgument.value,
		startingByteAddress,
		localWordOffset,
		region,
	});
}

function planModuleMemory(
	sourceModule: MemoryLayoutSourceModule,
	moduleByteAddress: number,
	region: MemoryRegionIdentity,
	prototypesById: Readonly<Record<string, MemoryLayoutSourcePrototype>>
): Omit<PlannedMemoryModule, 'byteAddress' | 'id' | 'lineNumber'> {
	let localWordOffset = 0;
	const memory: Record<string, PlannedMemoryDeclaration> = {};
	const declarations: PlannedMemoryDeclaration[] = [];
	const declarationSources = getEffectiveMemoryDeclarationSources(sourceModule, prototypesById);

	for (const declarationSource of declarationSources) {
		const plannedDeclaration = planDeclarationLine(declarationSource.line, moduleByteAddress, localWordOffset, region);
		const declaration = plannedDeclaration.declaration;

		memory[declaration.id] = declaration;
		declarations.push(declaration);
		localWordOffset = plannedDeclaration.nextLocalWordOffset;
	}

	return {
		...region,
		wordAlignedSize: localWordOffset,
		memory,
		declarations,
		declarationSources,
	};
}

/**
 * Plans module and declaration memory addresses without resolving default values.
 * The planner expects callers to provide syntactically valid, semantically
 * normalized layout input: unique ids, valid memory regions, and literal array
 * element counts.
 *
 * @param input - Source modules and optional layout settings.
 * @returns Address and size metadata for modules and memory declarations.
 */
export function planMemoryLayout(input: MemoryLayoutPlanInput): MemoryLayoutPlan {
	const startingByteAddress = input.startingByteAddress ?? GLOBAL_ALIGNMENT_BOUNDARY;
	const memoryRegions = input.memoryRegions ?? [];
	const prototypesById = getPrototypeMap(input.prototypes);
	const cursor = createModuleAddressCursor(startingByteAddress);
	const modules: Record<string, PlannedMemoryModule> = {};
	const moduleList: PlannedMemoryModule[] = [];

	for (const sourceModule of input.modules) {
		const region = getModuleRegion(sourceModule, memoryRegions);
		const moduleByteAddress = getNextModuleByteAddress(cursor, region.memoryIndex, startingByteAddress);
		const moduleMemory = planModuleMemory(sourceModule, moduleByteAddress, region, prototypesById);
		const plannedModule: PlannedMemoryModule = {
			...region,
			id: sourceModule.id,
			lineNumber: sourceModule.moduleLine.lineNumber,
			byteAddress: moduleByteAddress,
			wordAlignedSize: moduleMemory.wordAlignedSize,
			memory: moduleMemory.memory,
			declarations: moduleMemory.declarations,
			declarationSources: moduleMemory.declarationSources,
		};

		modules[plannedModule.id] = plannedModule;
		moduleList.push(plannedModule);
		advanceModuleByteAddress(cursor, region.memoryIndex, moduleByteAddress, plannedModule.wordAlignedSize);
	}

	return {
		modules,
		moduleList,
		nextByteAddressByMemoryIndex: { ...cursor },
	};
}
