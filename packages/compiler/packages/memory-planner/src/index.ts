import type {
	Argument,
	ArgumentCompileTimeExpression,
	CompileOptions,
	CompilerASTLine,
	Const,
	MemoryDeclarationLine,
	MemoryLayoutPlan,
	MemoryRegionIdentity,
	ModuleLine,
	PlannedMemoryDeclaration,
	PlannedMemoryDeclarationSource,
	PlannedMemoryModule,
	RegionLine,
	ScalarMemoryDeclarationLine,
	ShapeLine,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import {
	ArgumentType,
	ErrorCode,
	type ErrorCodeValue,
	GLOBAL_ALIGNMENT_BOUNDARY,
	getDefaultMemoryRegion,
	getMemoryRegionByIndex,
	getMemoryRegionByName,
	isArrayMemoryDeclarationLine,
	isMemoryDeclarationLine,
	isScalarMemoryDeclarationLine,
	validateMemoryRegionOptions,
} from '@8f4e/language-spec';
import { planArrayDeclarationLayout, planScalarDeclarationLayout } from './declarations';
import { getEndAddressSafeByteLength, getEndByteAddress, getWordAlignedByteLength } from './layoutAddresses';
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

interface MemoryLayoutSourcePrototype {
	id: string;
	memoryDeclarationLines: readonly MemoryDeclarationLine[];
}

type MemoryLayoutSourceLine = MemoryDeclarationLine | ShapeLine;

interface MemoryLayoutSourceModule {
	id: string;
	moduleLine: Pick<ModuleLine, 'lineNumber'>;
	regionLine?: Pick<RegionLine, 'arguments'>;
	lines: readonly MemoryLayoutSourceLine[];
}

interface MemoryLayoutPlanInput {
	prototypes: readonly MemoryLayoutSourcePrototype[];
	modules: readonly MemoryLayoutSourceModule[];
	startingByteAddress?: number;
	memoryRegions?: readonly string[];
}

export interface ProjectMemoryLayoutPlanInput {
	prototypes: readonly ValidatedPrototypeAST[];
	modules: readonly ValidatedModuleAST[];
	startingByteAddress?: number;
	memoryRegions?: Pick<CompileOptions, 'memoryRegions'>['memoryRegions'];
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

function getScalarDeclarationId(line: ScalarMemoryDeclarationLine): string {
	const firstArgument = line.arguments[0];
	if (firstArgument?.type === ArgumentType.IDENTIFIER && firstArgument.referenceKind === 'plain') {
		return firstArgument.value;
	}

	return '__anonymous__' + line.lineNumber;
}

function getPrototypeMap(
	prototypes: readonly MemoryLayoutSourcePrototype[]
): Readonly<Record<string, MemoryLayoutSourcePrototype>> {
	return Object.fromEntries(prototypes.map(prototype => [prototype.id, prototype]));
}

function getPrototypeSources(prototypes: readonly ValidatedPrototypeAST[]): MemoryLayoutSourcePrototype[] {
	const seenPrototypeIds = new Set<string>();

	return prototypes.map(prototype => {
		if (seenPrototypeIds.has(prototype.id)) {
			throw plannerError(
				ErrorCode.DUPLICATE_IDENTIFIER,
				prototype.prototypeLine,
				`Duplicate prototype shape id: ${prototype.id}`,
				{ identifier: prototype.id }
			);
		}
		seenPrototypeIds.add(prototype.id);

		return {
			id: prototype.id,
			memoryDeclarationLines: prototype.memoryDeclarationLines,
		};
	});
}

function literalToConst(argument: Extract<Argument, { type: typeof ArgumentType.LITERAL }>): Const {
	return {
		value: argument.value,
		isInteger: argument.isInteger,
		...(argument.isFloat64 ? { isFloat64: true } : {}),
	};
}

function constToLiteral(resolved: Const): Extract<Argument, { type: typeof ArgumentType.LITERAL }> {
	return {
		type: ArgumentType.LITERAL,
		value: resolved.value,
		isInteger: resolved.isInteger,
		...(resolved.isFloat64 ? { isFloat64: true } : {}),
	};
}

function evaluateLiteralExpression(
	left: Const,
	right: Const,
	operator: ArgumentCompileTimeExpression['operator']
): Const | undefined {
	if (operator === '/' && right.value === 0) {
		return undefined;
	}

	const value =
		operator === '+'
			? left.value + right.value
			: operator === '-'
				? left.value - right.value
				: operator === '*'
					? left.value * right.value
					: operator === '/'
						? left.value / right.value
						: left.value ** right.value;
	const isFloat64 = !!left.isFloat64 || !!right.isFloat64;
	const isInteger = !isFloat64 && left.isInteger && right.isInteger && Number.isInteger(value);

	return {
		value,
		isInteger,
		...(isFloat64 ? { isFloat64: true } : {}),
	};
}

function normalizePlannerArgument(argument: Argument): Argument {
	if (argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	if (argument.left.type !== ArgumentType.LITERAL || argument.right.type !== ArgumentType.LITERAL) {
		return argument;
	}

	const resolved = evaluateLiteralExpression(
		literalToConst(argument.left),
		literalToConst(argument.right),
		argument.operator
	);

	return resolved ? constToLiteral(resolved) : argument;
}

function getUnresolvedArgumentIdentifier(argument: Argument): string {
	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		return `${argument.left.value}${argument.operator}${argument.right.value}`;
	}

	return argument.type === ArgumentType.IDENTIFIER ? argument.value : String(argument.type);
}

function normalizeLayoutMemoryDeclarationLine(line: MemoryDeclarationLine): MemoryDeclarationLine {
	if (!isArrayMemoryDeclarationLine(line)) {
		return line;
	}

	const elementCount = normalizePlannerArgument(line.arguments[1]);
	if (elementCount.type !== ArgumentType.LITERAL) {
		throw plannerError(ErrorCode.UNDECLARED_IDENTIFIER, line, 'Unable to resolve memory declaration size.', {
			identifier: getUnresolvedArgumentIdentifier(elementCount),
		});
	}

	return elementCount === line.arguments[1]
		? line
		: ({
				...line,
				arguments: [line.arguments[0], elementCount, ...line.arguments.slice(2)],
			} as MemoryDeclarationLine);
}

function isShapeLine(line: CompilerASTLine): line is ShapeLine {
	return line.instruction === 'shape';
}

function collectModuleMemoryLayoutSourceLines(ast: ValidatedModuleAST): MemoryLayoutSourceModule {
	const sourceModule: MemoryLayoutSourceModule = {
		id: ast.id,
		moduleLine: ast.moduleLine,
		...(ast.regionLine ? { regionLine: ast.regionLine } : {}),
		lines: [],
	};

	for (const line of ast.lines) {
		if (isMemoryDeclarationLine(line)) {
			sourceModule.lines = [...sourceModule.lines, normalizeLayoutMemoryDeclarationLine(line)];
			continue;
		}

		if (isShapeLine(line)) {
			sourceModule.lines = [...sourceModule.lines, line];
		}
	}

	return sourceModule;
}

function createMemoryLayoutSourceModules(asts: readonly ValidatedModuleAST[]): MemoryLayoutSourceModule[] {
	return asts.map(collectModuleMemoryLayoutSourceLines);
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
): Omit<
	PlannedMemoryModule,
	'byteAddress' | 'id' | 'lineNumber' | 'wordAlignedByteLength' | 'endByteAddress' | 'endAddressSafeByteLength'
> {
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

/** Plans module and declaration memory addresses from internal planner-ready source. */
function planMemoryLayout(input: MemoryLayoutPlanInput): MemoryLayoutPlan {
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
			wordAlignedByteLength: getWordAlignedByteLength(moduleMemory.wordAlignedSize),
			endByteAddress: getEndByteAddress(moduleByteAddress, moduleMemory.wordAlignedSize),
			endAddressSafeByteLength: getEndAddressSafeByteLength(moduleMemory.wordAlignedSize),
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

/**
 * Builds planner-ready source from validated project ASTs and plans module memory layout.
 * Constant inlining must already have run, so array declaration counts are either
 * literal values or pure literal arithmetic that can be folded here.
 *
 * @param input - Validated project ASTs plus optional layout settings.
 * @returns Address and size metadata for modules and memory declarations.
 */
export function planProjectMemoryLayout(input: ProjectMemoryLayoutPlanInput): MemoryLayoutPlan {
	validateMemoryRegionOptions(input);

	return planMemoryLayout({
		prototypes: getPrototypeSources(input.prototypes),
		modules: createMemoryLayoutSourceModules(input.modules),
		startingByteAddress: input.startingByteAddress ?? GLOBAL_ALIGNMENT_BOUNDARY,
		memoryRegions: input.memoryRegions ?? [],
	});
}
