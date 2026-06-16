import type {
	AddressMetadata,
	Argument,
	AST,
	CompilerASTLine,
	CompileTimeOperand,
	Const,
	ConstantsAST,
	FunctionAST,
	FunctionValueType,
	LocalDeclarationLine,
	LocalMap,
	MemoryPointerMetadataMap,
	ModuleAST,
	NormalizedArgumentLiteral,
	ParamLine,
	PointerLocalBinding,
	PrototypeAST,
	ValidatedConstantsAST,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import { ArgumentType, isScalarMemoryDeclarationLine, POINTER_FUNCTION_TYPE_IDENTIFIERS } from '@8f4e/language-spec';
import type { MemoryLayoutPlan, PlannedMemoryModule } from '@8f4e/memory-planner';
import { evaluateResolvedValueExpression } from './evaluateResolvedValueExpression';
import {
	type MemoryReferenceModuleNamespace,
	type MemoryReferencePointerMetadataByModuleId,
	type MemoryReferenceResolutionContext,
	resolveMemoryExpressionOperand,
} from './resolveMemoryExpressionOperand';

export { memoryEndAddressValue, memoryStartAddressValue, moduleAddressValue } from './addressValues';
export {
	type MemoryReferenceModuleNamespace,
	type MemoryReferencePointerMetadataByModuleId,
	type MemoryReferenceResolutionContext,
	resolveMemoryExpressionOperand,
} from './resolveMemoryExpressionOperand';

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

export interface InlineMemoryReferencesInput<
	TPrototype extends PrototypeAST = ValidatedPrototypeAST,
	TModule extends ModuleAST = ValidatedModuleAST,
	TConstants extends ConstantsAST = ValidatedConstantsAST,
	TFunction extends FunctionAST = ValidatedFunctionAST,
> {
	ast: MemoryReferenceProjectAST<TPrototype, TModule, TConstants, TFunction>;
	memoryPlan: MemoryLayoutPlan;
}

export interface InlineMemoryReferencesResult<
	TPrototype extends PrototypeAST = ValidatedPrototypeAST,
	TModule extends ModuleAST = ValidatedModuleAST,
	TConstants extends ConstantsAST = ValidatedConstantsAST,
	TFunction extends FunctionAST = ValidatedFunctionAST,
> {
	ast: {
		prototypes: TPrototype[];
		modules: TModule[];
		constants: TConstants[];
		functions: TFunction[];
	};
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
	const byteLength = memoryItem.numberOfElements * memoryItem.elementWordSize;
	return Math.max(0, Math.floor((byteLength - byteOffset) / memoryItem.elementWordSize));
}

function updatePointerMemoryMetadata(line: CompilerASTLine, context: MemoryReferenceResolutionContext): void {
	if (!isScalarMemoryDeclarationLine(line)) {
		return;
	}

	const [idArgument, defaultArgument] = line.arguments;
	if (idArgument?.type !== ArgumentType.IDENTIFIER || defaultArgument?.type !== ArgumentType.LITERAL) {
		return;
	}

	const declaration = context.currentModule?.memory[idArgument.value];
	if (!declaration?.pointeeBaseType) {
		return;
	}

	const defaultAddress = (defaultArgument as NormalizedArgumentLiteral).address;
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

function resolveValueOperand(
	operand: CompileTimeOperand,
	context: MemoryReferenceResolutionContext
): Const | undefined {
	if (operand.type === ArgumentType.LITERAL) {
		return {
			value: operand.value,
			isInteger: operand.isInteger,
			...(operand.isFloat64 ? { isFloat64: true } : {}),
		};
	}

	return resolveMemoryExpressionOperand(operand, context);
}

function resolvedValueToLiteral(resolved: Const): NormalizedArgumentLiteral {
	return {
		type: ArgumentType.LITERAL,
		value: resolved.value,
		isInteger: resolved.isInteger,
		...(resolved.isFloat64 ? { isFloat64: true } : {}),
		...(resolved.address ? { address: resolved.address } : {}),
	};
}

/**
 * Attempts to fold an argument into a semantic value using the current memory layout context.
 * Constant identifiers are expected to have been inlined before this pass runs.
 *
 * @param context - Compilation context used by the operation.
 * @param argument - Argument whose resolved value or metadata should be used.
 * @returns Resolved value, or `undefined` when the argument cannot be folded.
 */
export function tryResolveValueArgument(
	context: MemoryReferenceResolutionContext,
	argument: Argument
): Const | undefined {
	if (argument.type !== ArgumentType.IDENTIFIER && argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return undefined;
	}

	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const leftConst = resolveValueOperand(argument.left, context);
		const rightConst = resolveValueOperand(argument.right, context);

		if (leftConst === undefined || rightConst === undefined) {
			return undefined;
		}

		if (argument.operator === '/' && rightConst.value === 0) {
			return undefined;
		}

		return evaluateResolvedValueExpression(leftConst, rightConst, argument.operator);
	}

	return resolveValueOperand(argument, context);
}

/**
 * Inlines one memory-layout value argument when the provided layout context can resolve it.
 *
 * @param argument - Argument to inline.
 * @param context - Compilation context used by the operation.
 * @returns The original argument or a literal carrying resolved value/address metadata.
 */
export function inlineMemoryReferenceArgument(
	argument: Argument,
	context: MemoryReferenceResolutionContext
): Argument | NormalizedArgumentLiteral {
	if (argument.type !== ArgumentType.IDENTIFIER && argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	const resolved = tryResolveValueArgument(context, argument);
	if (!resolved) {
		return argument;
	}

	return resolvedValueToLiteral(resolved);
}

/**
 * Returns a copied line with all resolvable memory-layout value references inlined.
 *
 * @param line - AST line to transform.
 * @param context - Compilation context used by the operation.
 * @returns Original line when unchanged, otherwise a copied line with inlined arguments.
 */
export function inlineMemoryReferencesInLine<TLine extends CompilerASTLine>(
	line: TLine,
	context: MemoryReferenceResolutionContext
): TLine {
	let changed = false;
	const nextArguments = line.arguments.map(argument => {
		const inlined = inlineMemoryReferenceArgument(argument, context);
		if (inlined !== argument) {
			changed = true;
		}
		return inlined;
	});

	return changed ? ({ ...line, arguments: nextArguments } as TLine) : line;
}

function replaceLine<TLine extends CompilerASTLine | undefined>(
	line: TLine,
	replacements: ReadonlyMap<CompilerASTLine, CompilerASTLine>
): TLine {
	return line ? ((replacements.get(line) ?? line) as TLine) : line;
}

function inlineMemoryReferencesInAst<TAst extends AST>(
	ast: TAst,
	memoryPlan: MemoryLayoutPlan,
	pointerMetadata: MemoryReferencePointerMetadataByModuleId
): TAst {
	const context =
		ast.type === 'module'
			? createModuleResolutionContext(memoryPlan, pointerMetadata, memoryPlan.modules[ast.id])
			: createProjectResolutionContext(memoryPlan, pointerMetadata);
	const replacements = new Map<CompilerASTLine, CompilerASTLine>();
	let nextLocalIndex = 0;
	const lines = ast.lines.map(line => {
		const nextLine = inlineMemoryReferencesInLine(line, context);
		if (nextLine !== line) {
			replacements.set(line, nextLine);
		}
		if (ast.type === 'function') {
			nextLocalIndex = collectFunctionLocal(line, context.locals, nextLocalIndex);
		}
		if (ast.type === 'module') {
			updatePointerMemoryMetadata(nextLine, context);
		}
		return nextLine;
	});

	if (replacements.size === 0) {
		return ast;
	}

	if (ast.type === 'module') {
		return {
			...ast,
			lines,
			moduleLine: replaceLine(ast.moduleLine, replacements),
			...(ast.regionLine ? { regionLine: replaceLine(ast.regionLine, replacements) } : {}),
			memoryDeclarationLines: ast.memoryDeclarationLines.map(line => replaceLine(line, replacements)),
		} as TAst;
	}

	if (ast.type === 'function') {
		return {
			...ast,
			lines,
			functionLine: replaceLine(ast.functionLine, replacements),
			functionEndLine: replaceLine(ast.functionEndLine, replacements),
			...(ast.exportLine ? { exportLine: replaceLine(ast.exportLine, replacements) } : {}),
			...(ast.importLine ? { importLine: replaceLine(ast.importLine, replacements) } : {}),
		} as TAst;
	}

	if (ast.type === 'constants') {
		return {
			...ast,
			lines,
			constantsLine: replaceLine(ast.constantsLine, replacements),
		} as TAst;
	}

	return {
		...ast,
		lines,
		prototypeLine: replaceLine(ast.prototypeLine, replacements),
		memoryDeclarationLines: ast.memoryDeclarationLines.map(line => replaceLine(line, replacements)),
	} as TAst;
}

/**
 * Returns a copied project AST with resolvable memory-layout value references inlined.
 *
 * @param input - Project AST and completed memory layout plan to transform.
 * @returns Inlined project AST collection.
 */
export function inlineMemoryReferences<
	TPrototype extends PrototypeAST,
	TModule extends ModuleAST,
	TConstants extends ConstantsAST,
	TFunction extends FunctionAST,
>(
	input: InlineMemoryReferencesInput<TPrototype, TModule, TConstants, TFunction>
): InlineMemoryReferencesResult<TPrototype, TModule, TConstants, TFunction> {
	const pointerMetadata: Record<string, MemoryPointerMetadataMap> = {};
	return {
		ast: {
			prototypes: input.ast.prototypes.map(ast => inlineMemoryReferencesInAst(ast, input.memoryPlan, pointerMetadata)),
			modules: input.ast.modules.map(ast => inlineMemoryReferencesInAst(ast, input.memoryPlan, pointerMetadata)),
			constants: input.ast.constants.map(ast => inlineMemoryReferencesInAst(ast, input.memoryPlan, pointerMetadata)),
			functions: input.ast.functions.map(ast => inlineMemoryReferencesInAst(ast, input.memoryPlan, pointerMetadata)),
		},
	};
}
