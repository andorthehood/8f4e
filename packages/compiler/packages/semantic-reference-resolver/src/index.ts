import type {
	CompilerASTLine,
	ConstantResolutionBlockFacts,
	ConstantsAST,
	FunctionAST,
	FunctionCompilationContext,
	FunctionMetadata,
	FunctionRegistry,
	FunctionTypeRegistry,
	FunctionValueType,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryPointerMetadataMap,
	MemoryReferenceResolutionBlockFacts,
	MemoryReferenceResolutionLineFacts,
	MemoryReferenceResolutionReport,
	ModuleAST,
	ModuleCompilationContext,
	Namespaces,
	PrototypeAST,
	ResolvedMapLine,
	SemanticReferenceLine,
	SemanticReferenceLineFacts,
	ValidatedConstantsAST,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import {
	ArgumentType,
	BlockType,
	compilerSourceBlockInstructionByType,
	createFunctionId,
	ErrorCode,
	functionValueTypeToLocalBinding,
	getEffectiveFunctionMetadata,
	getError,
	isSemanticInstructionLine,
	MAX_FUNCTION_PARAMETERS,
	resolveRegionDirective,
} from '@8f4e/language-spec';
import { createCompilationContext, popBlock, pushBlock } from '@8f4e/semantic-utils';
import resolveLineReferences from './resolveLineReferences';

const moduleBlockType = compilerSourceBlockInstructionByType.module.type;
const functionBlockType = compilerSourceBlockInstructionByType.function.type;

export interface SemanticReferenceResolverProjectAST<
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

export interface ResolveSemanticReferencesInput<
	TPrototype extends PrototypeAST = ValidatedPrototypeAST,
	TModule extends ModuleAST = ValidatedModuleAST,
	TConstants extends ConstantsAST = ValidatedConstantsAST,
	TFunction extends FunctionAST = ValidatedFunctionAST,
> {
	ast: SemanticReferenceResolverProjectAST<TPrototype, TModule, TConstants, TFunction>;
	namespaces: Namespaces;
	memoryPlan: MemoryLayoutPlan;
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
	constantReferences: {
		prototypes: readonly ConstantResolutionBlockFacts[];
		modules: readonly ConstantResolutionBlockFacts[];
		constants: readonly ConstantResolutionBlockFacts[];
		functions: readonly ConstantResolutionBlockFacts[];
	};
	memoryReferences: MemoryReferenceResolutionReport;
	functions: FunctionRegistry;
	functionTypeRegistry: FunctionTypeRegistry;
	memoryRegions: readonly string[];
	prototypeShapes: Readonly<Record<string, TPrototype>>;
}

export interface ModuleSemanticReferences {
	lineFacts: Array<SemanticReferenceLineFacts | undefined>;
}

export interface FunctionSemanticReferences {
	functionId: string;
	lineFacts: Array<SemanticReferenceLineFacts | undefined>;
}

export interface SemanticReferenceReport {
	modules: Record<string, ModuleSemanticReferences>;
	functions: Record<string, FunctionSemanticReferences>;
}

export interface ResolveSemanticReferencesResult {
	references: SemanticReferenceReport;
}

function haveSameArguments(left: CompilerASTLine['arguments'], right: CompilerASTLine['arguments']): boolean {
	return left.length === right.length && left.every((argument, index) => argument === right[index]);
}

function collectLineFacts(
	sourceLine: CompilerASTLine,
	resolvedLine: SemanticReferenceLine
): SemanticReferenceLineFacts | undefined {
	const facts: SemanticReferenceLineFacts = {};

	if (!haveSameArguments(sourceLine.arguments, resolvedLine.arguments)) {
		facts.arguments = resolvedLine.arguments;
	}
	if ('inlineArgumentPushes' in resolvedLine && resolvedLine.inlineArgumentPushes) {
		facts.inlineArgumentPushes = resolvedLine.inlineArgumentPushes;
	}
	if ('resolvedTarget' in resolvedLine) {
		facts.resolvedTarget = resolvedLine.resolvedTarget;
	}
	if ('shapeExpansions' in resolvedLine) {
		facts.shapeExpansions = resolvedLine.shapeExpansions;
	}

	return Object.keys(facts).length > 0 ? facts : undefined;
}

function applyConstantFacts<TLine extends CompilerASTLine>(
	line: TLine,
	facts?: ConstantResolutionBlockFacts['lineFacts'][number]
): TLine {
	return facts?.arguments ? ({ ...line, arguments: facts.arguments } as TLine) : line;
}

function applyMemoryReferenceFacts<TLine extends CompilerASTLine>(
	line: TLine,
	facts?: MemoryReferenceResolutionLineFacts
): TLine {
	return facts?.arguments ? ({ ...line, arguments: facts.arguments } as TLine) : line;
}

function applyResolvedArgumentFacts<TLine extends CompilerASTLine>(
	line: TLine,
	constantFacts: ConstantResolutionBlockFacts['lineFacts'][number],
	memoryReferenceFacts: MemoryReferenceResolutionLineFacts | undefined
): TLine {
	return applyMemoryReferenceFacts(applyConstantFacts(line, constantFacts), memoryReferenceFacts);
}

function collectPrototypeShapeIds(ast: ModuleAST): string[] {
	const prototypeShapeIds: string[] = [];
	for (const line of ast.lines) {
		if (line.instruction !== 'shape') {
			continue;
		}
		const prototypeId = line.arguments[0].value;
		if (!prototypeShapeIds.includes(prototypeId)) {
			prototypeShapeIds.push(prototypeId);
		}
	}
	return prototypeShapeIds;
}

function applySemanticLine(line: CompilerASTLine, context: ModuleCompilationContext): void {
	if (!isSemanticInstructionLine(line)) {
		return;
	}

	switch (line.instruction) {
		case 'const':
		case 'use':
			return;
		case 'module': {
			const moduleId = line.arguments[0].value;
			pushBlock(context, { expectedResultTypes: [], blockType: BlockType.MODULE });
			context.namespace.moduleName = moduleId;
			context.codeBlockId = moduleId;
			context.codeBlockType = moduleBlockType;
			return;
		}
		case '#region': {
			const region = resolveRegionDirective(line, context);
			context.currentMemoryIndex = region.memoryIndex;
			if (region.memoryRegionName) {
				context.currentMemoryRegionName = region.memoryRegionName;
			} else {
				delete context.currentMemoryRegionName;
			}
			return;
		}
		case 'moduleEnd':
			popBlock(context);
			return;
		case 'shape': {
			const prototypeId = line.arguments[0].value;
			if (!context.namespace.prototypeShapeIds.includes(prototypeId)) {
				context.namespace.prototypeShapeIds.push(prototypeId);
			}
			return;
		}
	}
}

function getPlannedMemoryDeclaration(
	context: ModuleCompilationContext | FunctionCompilationContext,
	memoryId: string,
	moduleId = context.namespace.moduleName
) {
	const currentModule = context.currentPlannedModule;
	const module = !moduleId || moduleId === currentModule?.id ? currentModule : context.memoryPlan.modules[moduleId];
	return module?.memory[memoryId];
}

function registerFunctionParameter(
	paramType: FunctionValueType,
	paramName: string,
	line: CompilerASTLine,
	context: FunctionCompilationContext
): void {
	if (context.locals[paramName] !== undefined) {
		throw getError(ErrorCode.DUPLICATE_PARAMETER_NAME, line, context);
	}

	context.locals[paramName] = functionValueTypeToLocalBinding(paramType, Object.keys(context.locals).length);
	context.currentFunctionParameterCount += 1;

	if (context.currentFunctionParameterCount > MAX_FUNCTION_PARAMETERS) {
		throw getError(ErrorCode.FUNCTION_SIGNATURE_OVERFLOW, line, context);
	}
}

function applyFunctionLine(line: CompilerASTLine, context: FunctionCompilationContext): void {
	const functionName = (line.arguments[0] as { value: string }).value;
	const functionId = context.currentFunctionMetadata.id;

	context.currentFunctionId = functionId;
	context.currentFunctionName = functionName;
	context.codeBlockId = functionName;
	context.codeBlockType = functionBlockType;
	context.currentFunctionParameterCount = 0;
	context.currentFunctionIsImpure = false;
	context.currentFunctionExportName = undefined;
	context.currentFunctionImport = undefined;
	context.mode = functionBlockType;
	context.locals = {};

	pushBlock(context, {
		blockType: BlockType.FUNCTION,
		expectedResultTypes: [],
	});
}

function applyParamShapeLine(line: CompilerASTLine, context: FunctionCompilationContext): void {
	const expansion = context.currentFunctionMetadata.paramShapeExpansions!.find(
		expansion => expansion.lineNumber === line.lineNumber
	)!;

	for (const parameter of expansion.parameters) {
		registerFunctionParameter(parameter.type, parameter.name, line, context);
	}
}

function applyLocalLine(line: CompilerASTLine, context: ModuleCompilationContext | FunctionCompilationContext): void {
	const typeArg = line.arguments[0] as { value: FunctionValueType };
	const nameArg = line.arguments[1] as { value: string };
	const localName = nameArg.value;

	if (getPlannedMemoryDeclaration(context, localName)) {
		throw getError(ErrorCode.LOCAL_NAME_COLLISION_WITH_MEMORY, line, context, { identifier: localName });
	}

	context.locals[localName] = functionValueTypeToLocalBinding(typeArg.value, Object.keys(context.locals).length);
}

function applyMapBeginLine(
	line: CompilerASTLine,
	context: ModuleCompilationContext | FunctionCompilationContext
): void {
	const inputType = (line.arguments[0] as { value: string }).value;

	pushBlock(context, {
		expectedResultTypes: [],
		blockType: BlockType.MAP,
		mapState: {
			inputIsInteger: inputType === 'int',
			inputIsFloat64: inputType === 'float64',
			rows: [],
			defaultSet: false,
		},
	});
}

function resolveMapArgumentValue(argument: ResolvedMapLine['arguments'][number]) {
	if (argument.type === ArgumentType.LITERAL) {
		return {
			value: argument.value,
			isInteger: argument.isInteger,
			isFloat64: !!argument.isFloat64,
		};
	}

	return {
		value: argument.value.charCodeAt(0),
		isInteger: true,
		isFloat64: false,
	};
}

function applyMapLine(line: ResolvedMapLine, context: ModuleCompilationContext | FunctionCompilationContext): void {
	const { mapState } = context.activeMapBlock!;
	const key = resolveMapArgumentValue(line.arguments[0]);
	const value = resolveMapArgumentValue(line.arguments[1]);

	mapState.rows.push({
		keyValue: key.value,
		valueValue: value.value,
		valueIsInteger: value.isInteger,
		...(value.isFloat64 ? { valueIsFloat64: true } : {}),
	});
}

function applyResolvedLineEffect(
	line: SemanticReferenceLine,
	context: ModuleCompilationContext | FunctionCompilationContext
): void {
	if (context.mode === 'module' && isSemanticInstructionLine(line)) {
		applySemanticLine(line, context);
		return;
	}

	switch (line.instruction) {
		case 'function':
			applyFunctionLine(line, context as FunctionCompilationContext);
			return;
		case 'functionEnd':
			popBlock(context);
			return;
		case 'param': {
			const paramType = line.arguments[0].value as FunctionValueType;
			const paramName = line.arguments[1].value;
			registerFunctionParameter(paramType, paramName, line, context as FunctionCompilationContext);
			return;
		}
		case 'paramShape':
			applyParamShapeLine(line, context as FunctionCompilationContext);
			return;
		case 'local':
			applyLocalLine(line, context);
			return;
		case 'mapBegin':
			applyMapBeginLine(line, context);
			return;
		case 'map':
			applyMapLine(line as ResolvedMapLine, context);
			return;
		case 'mapEnd':
			popBlock(context);
			return;
	}
}

function createModuleContext(
	input: ResolveSemanticReferencesInput<PrototypeAST, ModuleAST, ConstantsAST, FunctionAST>,
	ast: ModuleAST
): ModuleCompilationContext {
	const plannedModule = input.memoryPlan.modules[ast.id];
	return createCompilationContext<ModuleCompilationContext>({
		namespace: {
			namespaces: input.namespaces,
			moduleName: undefined,
			functions: input.functions,
			prototypeShapeIds: collectPrototypeShapeIds(ast),
		},
		locals: {},
		byteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress: plannedModule.byteAddress,
		currentModuleNextWordOffset: plannedModule.wordAlignedSize,
		currentModuleWordAlignedSize: plannedModule.wordAlignedSize,
		currentMemoryIndex: plannedModule.memoryIndex,
		...(plannedModule.memoryRegionName ? { currentMemoryRegionName: plannedModule.memoryRegionName } : {}),
		memoryPlan: input.memoryPlan,
		currentPlannedModule: plannedModule,
		memoryDefaults: input.memoryDefaultsByModuleId[ast.id],
		pointerMetadata: input.pointerMetadataByModuleId[ast.id],
		memoryRegions: [...input.memoryRegions],
		mode: 'module',
		functionTypeRegistry: input.functionTypeRegistry,
		prototypeShapes: input.prototypeShapes,
		projectBlockId: ast.projectBlockId,
		source: ast.source,
	});
}

function getFunctionMetadata(
	input: ResolveSemanticReferencesInput<PrototypeAST, ModuleAST, ConstantsAST, FunctionAST>,
	ast: FunctionAST
): FunctionMetadata {
	const signatureMetadata = getEffectiveFunctionMetadata(ast, input.prototypeShapes);
	const functionId = createFunctionId(ast.name, signatureMetadata.signature.parameters);
	const functionMetadata = input.functions.byId[functionId];
	if (!functionMetadata) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, ast.functionLine, {
			codeBlockType: ast.type,
			...(ast.projectBlockId !== undefined ? { projectBlockId: ast.projectBlockId } : {}),
		});
	}

	return functionMetadata;
}

function createFunctionContext(
	input: ResolveSemanticReferencesInput<PrototypeAST, ModuleAST, ConstantsAST, FunctionAST>,
	ast: FunctionAST,
	functionMetadata: FunctionMetadata
): FunctionCompilationContext {
	return createCompilationContext<FunctionCompilationContext>({
		namespace: {
			namespaces: input.namespaces,
			moduleName: undefined,
			functions: input.functions,
			prototypeShapeIds: [],
		},
		locals: {},
		byteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress: 0,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: 0,
		currentMemoryIndex: 0,
		memoryPlan: input.memoryPlan,
		memoryDefaults: {},
		pointerMetadata: {},
		memoryRegions: [],
		mode: 'function',
		codeBlockType: 'function',
		projectBlockId: ast.projectBlockId,
		source: ast.source,
		currentFunctionId: functionMetadata.id,
		currentFunctionName: functionMetadata.name,
		currentFunctionMetadata: functionMetadata,
		currentFunctionParameterCount: 0,
		functionTypeRegistry: input.functionTypeRegistry,
		prototypeShapes: input.prototypeShapes,
	});
}

function resolveLineFacts<TContext extends ModuleCompilationContext | FunctionCompilationContext>(
	lines: readonly CompilerASTLine[],
	context: TContext,
	constantReferences: ConstantResolutionBlockFacts | undefined,
	memoryReferences: MemoryReferenceResolutionBlockFacts | undefined
): Array<SemanticReferenceLineFacts | undefined> {
	const lineFacts: Array<SemanticReferenceLineFacts | undefined> = [];

	for (const [lineIndex, originalLine] of lines.entries()) {
		const sourceLine = applyResolvedArgumentFacts(
			originalLine,
			constantReferences?.lineFacts[lineIndex],
			memoryReferences?.lineFacts[lineIndex]
		);
		const line = resolveLineReferences(sourceLine, context);
		lineFacts.push(collectLineFacts(originalLine, line));
		applyResolvedLineEffect(line, context);
	}

	return lineFacts;
}

function resolveModuleReferences(
	input: ResolveSemanticReferencesInput<PrototypeAST, ModuleAST, ConstantsAST, FunctionAST>,
	ast: ModuleAST,
	astIndex: number
): [string, ModuleSemanticReferences] {
	const lineFacts = resolveLineFacts(
		ast.lines,
		createModuleContext(input, ast),
		input.constantReferences.modules[astIndex],
		input.memoryReferences.modules[astIndex]
	);
	return [ast.id, { lineFacts }];
}

function resolveFunctionReferences(
	input: ResolveSemanticReferencesInput<PrototypeAST, ModuleAST, ConstantsAST, FunctionAST>,
	ast: FunctionAST,
	astIndex: number
): [string, FunctionSemanticReferences] {
	const functionMetadata = getFunctionMetadata(input, ast);
	const lineFacts = resolveLineFacts(
		ast.lines,
		createFunctionContext(input, ast, functionMetadata),
		input.constantReferences.functions[astIndex],
		input.memoryReferences.functions[astIndex]
	);
	return [functionMetadata.id, { functionId: functionMetadata.id, lineFacts }];
}

/**
 * Resolves semantic references once for the full compiler project.
 *
 * @param input - Project AST and semantic facts produced by earlier compiler passes.
 * @returns Semantic reference facts keyed back to the original project AST.
 */
export function resolveSemanticReferences<
	TPrototype extends PrototypeAST = ValidatedPrototypeAST,
	TModule extends ModuleAST = ValidatedModuleAST,
	TConstants extends ConstantsAST = ValidatedConstantsAST,
	TFunction extends FunctionAST = ValidatedFunctionAST,
>(input: ResolveSemanticReferencesInput<TPrototype, TModule, TConstants, TFunction>): ResolveSemanticReferencesResult {
	return {
		references: {
			modules: Object.fromEntries(input.ast.modules.map((ast, index) => resolveModuleReferences(input, ast, index))),
			functions: Object.fromEntries(
				input.ast.functions.map((ast, index) => resolveFunctionReferences(input, ast, index))
			),
		},
	};
}
