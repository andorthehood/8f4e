import type {
	MemoryDeclarationLine,
	MemoryLayoutPlan,
	MemoryRegionIdentity,
	ModuleLine,
	PlannedMemoryDeclaration,
	PlannedMemoryModule,
	RegionLine,
} from '@8f4e/compiler-spec';
import { ArgumentType, GLOBAL_ALIGNMENT_BOUNDARY, isScalarMemoryDeclarationLine } from '@8f4e/compiler-spec';
import { planArrayDeclarationLayout, planScalarDeclarationLayout } from './declarations';
import { advanceModuleByteAddress, createModuleAddressCursor, getNextModuleByteAddress } from './modules';

export type {
	MemoryLayoutPlan,
	MemoryRegionIdentity,
	PlannedMemoryDeclaration,
	PlannedMemoryModule,
} from '@8f4e/compiler-spec';

export interface MemoryLayoutSourceModule {
	id: string;
	moduleLine: Pick<ModuleLine, 'lineNumber'>;
	regionLine?: Pick<RegionLine, 'arguments'>;
	memoryDeclarationLines: readonly MemoryDeclarationLine[];
}

export interface MemoryLayoutPlanInput {
	modules: readonly MemoryLayoutSourceModule[];
	startingByteAddress?: number;
	memoryRegions?: readonly string[];
}

function getCustomMemoryRegionName(memoryRegions: readonly string[], memoryIndex: number): string | undefined {
	return memoryIndex === 0 ? undefined : memoryRegions[memoryIndex - 1];
}

function resolveMemoryRegionByIndex(memoryIndex: number, memoryRegions: readonly string[]): MemoryRegionIdentity {
	const memoryRegionName = getCustomMemoryRegionName(memoryRegions, memoryIndex);
	return {
		memoryIndex,
		...(memoryRegionName ? { memoryRegionName } : {}),
	};
}

function resolveMemoryRegionName(memoryRegionName: string, memoryRegions: readonly string[]): MemoryRegionIdentity {
	const regionIndex = memoryRegions.indexOf(memoryRegionName);

	return {
		memoryIndex: regionIndex + 1,
		memoryRegionName,
	};
}

function getModuleRegion(ast: MemoryLayoutSourceModule, memoryRegions: readonly string[]): MemoryRegionIdentity {
	const regionLine = ast.regionLine;
	if (!regionLine) {
		return { memoryIndex: 0 };
	}

	const [argument] = regionLine.arguments;
	if (argument.type === ArgumentType.LITERAL) {
		return resolveMemoryRegionByIndex(argument.value, memoryRegions);
	}

	return resolveMemoryRegionName(argument.value, memoryRegions);
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
	region: MemoryRegionIdentity
): Omit<PlannedMemoryModule, 'byteAddress' | 'id' | 'lineNumber'> {
	let localWordOffset = 0;
	const memory: Record<string, PlannedMemoryDeclaration> = {};
	const declarations: PlannedMemoryDeclaration[] = [];

	for (const line of sourceModule.memoryDeclarationLines) {
		const plannedDeclaration = planDeclarationLine(line, moduleByteAddress, localWordOffset, region);
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
	const cursor = createModuleAddressCursor(startingByteAddress);
	const modules: Record<string, PlannedMemoryModule> = {};
	const moduleList: PlannedMemoryModule[] = [];

	for (const sourceModule of input.modules) {
		const region = getModuleRegion(sourceModule, memoryRegions);
		const moduleByteAddress = getNextModuleByteAddress(cursor, region.memoryIndex, startingByteAddress);
		const moduleMemory = planModuleMemory(sourceModule, moduleByteAddress, region);
		const plannedModule: PlannedMemoryModule = {
			...region,
			id: sourceModule.id,
			lineNumber: sourceModule.moduleLine.lineNumber,
			byteAddress: moduleByteAddress,
			wordAlignedSize: moduleMemory.wordAlignedSize,
			memory: moduleMemory.memory,
			declarations: moduleMemory.declarations,
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
