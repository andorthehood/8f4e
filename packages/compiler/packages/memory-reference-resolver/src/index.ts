import type {
	AddressMetadata,
	Argument,
	CompilerASTLine,
	Const,
	ConstantResolutionBlockFacts,
	ConstantResolutionLineFacts,
	ConstantsAST,
	FunctionAST,
	FunctionValueType,
	LocalDeclarationLine,
	LocalMap,
	MemoryPointerMetadataMap,
	MemoryReferenceResolutionBlockFacts,
	MemoryReferenceResolutionLineFacts,
	MemoryReferenceResolutionReport,
	ModuleAST,
	ParamLine,
	PointerLocalBinding,
	PrototypeAST,
	ResolvedArgumentLiteral,
	ValidatedConstantsAST,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import { ArgumentType, isScalarMemoryDeclarationLine, POINTER_FUNCTION_TYPE_IDENTIFIERS } from '@8f4e/language-spec';
import type { MemoryLayoutPlan, PlannedMemoryModule } from '@8f4e/memory-planner';
import type {
	MemoryReferenceModuleNamespace,
	MemoryReferencePointerMetadataByModuleId,
	MemoryReferenceResolutionContext,
} from './resolveMemoryExpressionOperand';
import { tryResolveValueArgument } from './tryResolveValueArgument';

export type {
	MemoryReferenceResolutionBlockFacts,
	MemoryReferenceResolutionLineFacts,
	MemoryReferenceResolutionReport,
} from '@8f4e/language-spec';

export interface MemoryReferenceProjectAST<
	TPrototype extends PrototypeAST = ValidatedPrototypeAST,
	TModule extends ModuleAST = ValidatedModuleAST,
	TConstants extends ConstantsAST = ValidatedConstantsAST,
	TFunction extends FunctionAST = ValidatedFunctionAST,
> {
	prototypes: readonly TPrototype[];
	modules: readonly TModule[];
	constants: readonly TConstants[];
	functions: readonly TFunction[];
}

export interface ResolveMemoryReferencesInput<
	TPrototype extends PrototypeAST = ValidatedPrototypeAST,
	TModule extends ModuleAST = ValidatedModuleAST,
	TConstants extends ConstantsAST = ValidatedConstantsAST,
	TFunction extends FunctionAST = ValidatedFunctionAST,
> {
	ast: MemoryReferenceProjectAST<TPrototype, TModule, TConstants, TFunction>;
	memoryPlan: MemoryLayoutPlan;
	constantReferences: {
		prototypes: readonly ConstantResolutionBlockFacts[];
		modules: readonly ConstantResolutionBlockFacts[];
		constants: readonly ConstantResolutionBlockFacts[];
		functions: readonly ConstantResolutionBlockFacts[];
	};
}

export interface ResolveMemoryReferencesResult {
	references: MemoryReferenceResolutionReport;
}

function createProjectResolutionContext(
	memoryPlan: MemoryLayoutPlan,
	pointerMetadata: MemoryReferencePointerMetadataByModuleId
): MemoryReferenceResolutionContext {
	return {
		memoryPlan,
		pointerMetadata,
		locals: {},
		startingByteAddress: 0,
		currentModuleWordAlignedSize: 0,
		currentMemoryIndex: 0,
	};
}

function createModuleResolutionContext(
	memoryPlan: MemoryLayoutPlan,
	pointerMetadata: MemoryReferencePointerMetadataByModuleId,
	module: PlannedMemoryModule
): MemoryReferenceResolutionContext {
	return {
		memoryPlan,
		currentModule: module,
		pointerMetadata,
		moduleName: module.id,
		locals: {},
		startingByteAddress: module.byteAddress,
		currentModuleWordAlignedSize: module.wordAlignedSize,
		currentMemoryIndex: module.memoryIndex,
		...(module.memoryRegionName ? { currentMemoryRegionName: module.memoryRegionName } : {}),
	};
}

const pointerFunctionValueTypes = new Set<string>(POINTER_FUNCTION_TYPE_IDENTIFIERS);

function createPointerLocalBinding(type: FunctionValueType, index: number): PointerLocalBinding | undefined {
	if (!pointerFunctionValueTypes.has(type)) {
		return undefined;
	}

	return {
		isInteger: true,
		pointeeBaseType: type.replace(/\*+$/, '') as PointerLocalBinding['pointeeBaseType'],
		pointerDepth: type.endsWith('**') ? 2 : 1,
		index,
	};
}

type FunctionLocalDeclarationLine = ParamLine | LocalDeclarationLine;

function isFunctionLocalDeclarationLine(line: CompilerASTLine): line is FunctionLocalDeclarationLine {
	if (line.instruction !== 'param' && line.instruction !== 'local') {
		return false;
	}

	return true;
}

function collectFunctionLocal(line: CompilerASTLine, locals: LocalMap, nextLocalIndex: number): number {
	if (!isFunctionLocalDeclarationLine(line)) {
		return nextLocalIndex;
	}

	const [typeArgument, nameArgument] = line.arguments;
	const pointerLocal = createPointerLocalBinding(typeArgument.value as FunctionValueType, nextLocalIndex);
	if (pointerLocal) {
		locals[nameArgument.value] = pointerLocal;
	}

	return nextLocalIndex + 1;
}

function getPointeeMemoryItem(
	safeRange: NonNullable<AddressMetadata['safeRange']>,
	context: MemoryReferenceResolutionContext
): MemoryReferenceModuleNamespace['memory'][string] | undefined {
	const memoryId = safeRange.memoryId;
	if (!memoryId) {
		return undefined;
	}

	const moduleId = safeRange.moduleId ?? context.moduleName ?? context.currentModule?.id;
	return moduleId ? context.memoryPlan.modules[moduleId]?.memory[memoryId] : undefined;
}

function getPointeeElementCount(
	defaultAddress: AddressMetadata | undefined,
	context: MemoryReferenceResolutionContext
): number | undefined {
	const safeRange = defaultAddress?.safeRange;
	if (!safeRange || safeRange.source !== 'memory-start') {
		return undefined;
	}

	const memoryItem = getPointeeMemoryItem(safeRange, context);
	if (!memoryItem) {
		return undefined;
	}

	const byteOffset = Math.max(0, safeRange.byteAddress - memoryItem.byteAddress);
	return Math.max(0, Math.floor((memoryItem.elementByteLength - byteOffset) / memoryItem.elementWordSize));
}

function updatePointerMemoryMetadata(line: CompilerASTLine, context: MemoryReferenceResolutionContext): void {
	if (!isScalarMemoryDeclarationLine(line)) {
		return;
	}

	const [idArgument, defaultArgument] = line.arguments;
	if (idArgument?.type !== ArgumentType.IDENTIFIER) {
		return;
	}

	const declaration = context.currentModule?.memory[idArgument.value];
	if (!declaration?.pointeeBaseType) {
		return;
	}

	const defaultAddress =
		defaultArgument?.type === ArgumentType.LITERAL ? (defaultArgument as ResolvedArgumentLiteral).address : undefined;
	const pointeeElementCount = getPointeeElementCount(defaultAddress, context);
	const moduleId = context.moduleName ?? context.currentModule?.id;
	if (!moduleId) {
		return;
	}

	const modulePointerMetadata = (context.pointerMetadata[moduleId] ??= {});
	modulePointerMetadata[idArgument.value] = {
		pointeeMemoryIndex: defaultAddress?.memoryIndex ?? 0,
		...(defaultAddress?.memoryRegionName ? { pointeeMemoryRegionName: defaultAddress.memoryRegionName } : {}),
		...(pointeeElementCount !== undefined && pointeeElementCount !== 1 ? { pointeeElementCount } : {}),
	};
}

function resolvedValueToLiteral(resolved: Const): ResolvedArgumentLiteral {
	return {
		type: ArgumentType.LITERAL,
		value: resolved.value,
		isInteger: resolved.isInteger,
		...(resolved.isFloat64 ? { isFloat64: true } : {}),
		...(resolved.address ? { address: resolved.address } : {}),
	};
}

function resolveMemoryReferenceArgument(
	argument: Argument,
	context: MemoryReferenceResolutionContext
): Argument | ResolvedArgumentLiteral {
	if (argument.type !== ArgumentType.IDENTIFIER && argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	const resolved = tryResolveValueArgument(context, argument);
	if (!resolved) {
		return argument;
	}

	return resolvedValueToLiteral(resolved);
}

function resolveMemoryReferenceLineFacts(
	line: CompilerASTLine,
	context: MemoryReferenceResolutionContext
): MemoryReferenceResolutionLineFacts | undefined {
	let changed = false;
	const nextArguments = line.arguments.map(argument => {
		const resolved = resolveMemoryReferenceArgument(argument, context);
		if (resolved !== argument) {
			changed = true;
		}
		return resolved;
	});

	return changed ? { arguments: nextArguments } : undefined;
}

function applyConstantFacts<TLine extends CompilerASTLine>(line: TLine, facts?: ConstantResolutionLineFacts): TLine {
	return facts?.arguments ? ({ ...line, arguments: facts.arguments } as TLine) : line;
}

function applyMemoryReferenceFacts<TLine extends CompilerASTLine>(
	line: TLine,
	facts?: MemoryReferenceResolutionLineFacts
): TLine {
	return facts?.arguments ? ({ ...line, arguments: facts.arguments } as TLine) : line;
}

function resolveMemoryReferencesInAst(
	ast: PrototypeAST | ModuleAST | ConstantsAST | FunctionAST,
	memoryPlan: MemoryLayoutPlan,
	pointerMetadata: MemoryReferencePointerMetadataByModuleId,
	constantReferences: ConstantResolutionBlockFacts | undefined
): MemoryReferenceResolutionBlockFacts {
	const context =
		ast.type === 'module'
			? createModuleResolutionContext(memoryPlan, pointerMetadata, memoryPlan.modules[ast.id])
			: createProjectResolutionContext(memoryPlan, pointerMetadata);
	let nextLocalIndex = 0;
	const lineFacts = ast.lines.map((line, lineIndex) => {
		const constantResolvedLine = applyConstantFacts(line, constantReferences?.lineFacts[lineIndex]);
		const memoryReferenceFacts = resolveMemoryReferenceLineFacts(constantResolvedLine, context);
		const resolvedLine = applyMemoryReferenceFacts(constantResolvedLine, memoryReferenceFacts);
		if (ast.type === 'function') {
			nextLocalIndex = collectFunctionLocal(resolvedLine, context.locals, nextLocalIndex);
		}
		if (ast.type === 'module') {
			updatePointerMemoryMetadata(resolvedLine, context);
		}
		return memoryReferenceFacts;
	});

	return { lineFacts };
}

function resolveDeclarationSourceReferences(
	module: PlannedMemoryModule,
	memoryPlan: MemoryLayoutPlan,
	pointerMetadata: MemoryReferencePointerMetadataByModuleId
): MemoryReferenceResolutionBlockFacts {
	pointerMetadata[module.id] = pointerMetadata[module.id] ?? {};
	const context = createModuleResolutionContext(memoryPlan, pointerMetadata, module);
	const lineFacts = module.declarationSources.map(({ line }) => {
		const memoryReferenceFacts = resolveMemoryReferenceLineFacts(line, context);
		updatePointerMemoryMetadata(applyMemoryReferenceFacts(line, memoryReferenceFacts), context);
		return memoryReferenceFacts;
	});

	return { lineFacts };
}

/**
 * Resolves memory-layout value references once for the full compiler project.
 *
 * @param input - Project AST, completed memory layout plan, and constant-resolution facts.
 * @returns Memory-reference facts aligned with the input AST and planned memory declaration sources.
 */
export function resolveMemoryReferences<
	TPrototype extends PrototypeAST = ValidatedPrototypeAST,
	TModule extends ModuleAST = ValidatedModuleAST,
	TConstants extends ConstantsAST = ValidatedConstantsAST,
	TFunction extends FunctionAST = ValidatedFunctionAST,
>(input: ResolveMemoryReferencesInput<TPrototype, TModule, TConstants, TFunction>): ResolveMemoryReferencesResult {
	const pointerMetadata: Record<string, MemoryPointerMetadataMap> = {};
	const declarationSourcesByModuleId: Record<string, MemoryReferenceResolutionBlockFacts> = {};

	for (const plannedModule of input.memoryPlan.moduleList) {
		declarationSourcesByModuleId[plannedModule.id] = resolveDeclarationSourceReferences(
			plannedModule,
			input.memoryPlan,
			pointerMetadata
		);
	}

	return {
		references: {
			prototypes: input.ast.prototypes.map((ast, index) =>
				resolveMemoryReferencesInAst(ast, input.memoryPlan, pointerMetadata, input.constantReferences.prototypes[index])
			),
			modules: input.ast.modules.map((ast, index) =>
				resolveMemoryReferencesInAst(ast, input.memoryPlan, pointerMetadata, input.constantReferences.modules[index])
			),
			constants: input.ast.constants.map((ast, index) =>
				resolveMemoryReferencesInAst(ast, input.memoryPlan, pointerMetadata, input.constantReferences.constants[index])
			),
			functions: input.ast.functions.map((ast, index) =>
				resolveMemoryReferencesInAst(ast, input.memoryPlan, pointerMetadata, input.constantReferences.functions[index])
			),
			declarationSourcesByModuleId,
			pointerMetadataByModuleId: pointerMetadata,
		},
	};
}
