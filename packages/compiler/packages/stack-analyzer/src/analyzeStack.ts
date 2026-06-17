import type {
	CompilationContext,
	CompiledStackAnalysisLine,
	CompilerASTLine,
	FunctionCompilationContext,
	FunctionImportMetadata,
	FunctionMetadata,
	FunctionRegistry,
	FunctionTypeRegistry,
	FunctionValueType,
	LocalBinding,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryPointerMetadataMap,
	ModuleCompilationContext,
	Namespaces,
	ResolvedDefaultLine,
	ResolvedMapLine,
	SemanticInstructionLine,
	SemanticReferenceLine,
	Stack,
	StackAnalysisLineFacts,
	StackAnalysisLocalPointerFact,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import {
	ArgumentType,
	BlockType,
	compilerSourceBlockInstructionByType,
	createFunctionId,
	DEFAULT_HOST_IMPORT_MODULE_NAME,
	ErrorCode,
	functionValueTypeToLocalBinding,
	getEffectiveFunctionMetadata,
	getError,
	isFunctionBodyInstructionName,
	isImportedFunctionDeclarationInstructionName,
	isMemoryDeclarationLine,
	isSemanticInstructionLine,
	resolveRegionDirective,
} from '@8f4e/language-spec';
import type { SemanticReferenceReport } from '@8f4e/semantic-reference-resolver';
import { createCompilationContext, popBlock, pushBlock, resolveMapKind } from '@8f4e/semantic-utils';
import { analyzeInstruction } from './analyzeInstruction';
import { cloneStack } from './instructionAnalyzers/stack';
import { validateMapValueKind } from './mapValueKind';

const moduleBlockType = compilerSourceBlockInstructionByType.module.type;
const functionBlockType = compilerSourceBlockInstructionByType.function.type;

export interface AnalyzeStackProjectInput {
	ast: {
		modules: readonly ValidatedModuleAST[];
		functions: readonly ValidatedFunctionAST[];
	};
	semanticReferences: SemanticReferenceReport;
	namespaces: Namespaces;
	memoryPlan: MemoryLayoutPlan;
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
	functions: FunctionRegistry;
	functionTypeRegistry: FunctionTypeRegistry;
	memoryRegions: readonly string[];
	prototypeShapes: Readonly<Record<string, ValidatedPrototypeAST>>;
}

export interface StackAnalyzedModule {
	lineFacts: Array<StackAnalysisLineFacts | undefined>;
	stackAnalysis: CompiledStackAnalysisLine[];
	finalStack: Stack;
	skipExecutionInCycle?: boolean;
}

export interface StackAnalyzedFunction {
	functionId: string;
	lineFacts: Array<StackAnalysisLineFacts | undefined>;
	stackAnalysis: CompiledStackAnalysisLine[];
	finalStack: Stack;
	locals: Record<string, LocalBinding>;
	parameterCount: number;
	import?: FunctionImportMetadata;
	exportName?: string;
	used?: boolean;
}

export interface StackAnalysisProjectReport {
	modules: Record<string, StackAnalyzedModule>;
	functions: Record<string, StackAnalyzedFunction>;
	usedFunctionIds: string[];
}

function toCompiledStackAnalysisLine(line: CompilerASTLine, facts: StackAnalysisLineFacts): CompiledStackAnalysisLine {
	return {
		lineNumber: line.lineNumber,
		instruction: line.instruction,
		stackAnalysis: facts.stackAnalysis,
	};
}

function createEmptyLineFacts(_line: CompilerASTLine, context: CompilationContext): StackAnalysisLineFacts {
	const stackBefore = cloneStack(context.stack);
	return {
		stackAnalysis: {
			stackBefore,
			stackAfter: cloneStack(context.stack),
			consumedOperands: [],
			producedStackItems: [],
		},
	};
}

function collectPrototypeShapeIds(ast: ValidatedModuleAST): string[] {
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

function applySemanticLine(line: SemanticInstructionLine, context: CompilationContext): void {
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

function registerFunctionParameter(
	paramType: FunctionValueType,
	paramName: string,
	context: FunctionCompilationContext
): void {
	context.locals[paramName] = functionValueTypeToLocalBinding(paramType, Object.keys(context.locals).length);
	context.currentFunctionParameterCount += 1;
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
		registerFunctionParameter(parameter.type, parameter.name, context);
	}
}

function applyLocalLine(line: CompilerASTLine, context: CompilationContext): void {
	const typeArg = line.arguments[0] as { value: FunctionValueType };
	const nameArg = line.arguments[1] as { value: string };
	const localName = nameArg.value;

	context.locals[localName] = functionValueTypeToLocalBinding(typeArg.value, Object.keys(context.locals).length);
}

function applyLocalSetLine(
	line: CompilerASTLine,
	facts: StackAnalysisLineFacts,
	context: CompilationContext
): StackAnalysisLocalPointerFact | undefined {
	const [operand] = facts.stackAnalysis.consumedOperands;
	const localName = (line.arguments[0] as { value: string }).value;
	const local = context.locals[localName]!;
	if (!local.pointeeBaseType || operand?.kind !== 'address') {
		return undefined;
	}

	local.pointeeMemoryIndex = operand.address.memoryIndex;
	if (operand.address.memoryRegionName) {
		local.pointeeMemoryRegionName = operand.address.memoryRegionName;
	} else {
		delete local.pointeeMemoryRegionName;
	}

	return {
		localName,
		pointeeMemoryIndex: operand.address.memoryIndex,
		...(operand.address.memoryRegionName ? { pointeeMemoryRegionName: operand.address.memoryRegionName } : {}),
	};
}

function getResultTypes(line: CompilerASTLine): Array<'int' | 'float'> {
	const pairedLine = line as CompilerASTLine & {
		blockBlock?: { resultTypes: Array<'int' | 'float'> };
		ifBlock?: { resultTypes: Array<'int' | 'float'> };
	};
	return pairedLine.blockBlock?.resultTypes ?? pairedLine.ifBlock?.resultTypes ?? [];
}

function applyLoopLine(line: CompilerASTLine, context: CompilationContext): void {
	const loopCounterLocalName = `__infiniteLoopProtectionCounter${line.lineNumber}`;
	const loopCounterLocal = {
		isInteger: true,
		index: Object.keys(context.locals).length,
	};
	context.locals[loopCounterLocalName] = loopCounterLocal;
	pushBlock(context, {
		expectedResultTypes: [],
		blockType: BlockType.LOOP,
		loopCounterLocalName,
		loopCounterLocal,
	});
}

function applyMapBeginLine(line: CompilerASTLine, context: CompilationContext): void {
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

function applyMapLine(line: ResolvedMapLine, context: CompilationContext): void {
	const { mapState } = context.activeMapBlock!;
	const key = resolveMapArgumentValue(line.arguments[0]);
	const value = resolveMapArgumentValue(line.arguments[1]);
	const inputKind = resolveMapKind({
		valueType: mapState.inputIsInteger ? 'int' : mapState.inputIsFloat64 ? 'float64' : 'float',
	});

	validateMapValueKind(
		{
			valueType: key.isInteger ? 'int' : key.isFloat64 ? 'float64' : 'float',
		},
		inputKind,
		line,
		context
	);

	mapState.rows.push({
		keyValue: key.value,
		valueValue: value.value,
		valueIsInteger: value.isInteger,
		...(value.isFloat64 ? { valueIsFloat64: true } : {}),
	});
}

function applyDefaultLine(line: ResolvedDefaultLine, context: CompilationContext): void {
	const { mapState } = context.activeMapBlock!;
	const valueArg = line.arguments[0];

	mapState.defaultValue = valueArg.value;
	mapState.defaultIsInteger = valueArg.isInteger;
	mapState.defaultIsFloat64 = !!valueArg.isFloat64;
	mapState.defaultSet = true;
}

function applyStackLineEffect(
	line: SemanticReferenceLine,
	facts: StackAnalysisLineFacts,
	context: CompilationContext
): void {
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
			registerFunctionParameter(paramType, paramName, context as FunctionCompilationContext);
			return;
		}
		case 'paramShape':
			applyParamShapeLine(line, context as FunctionCompilationContext);
			return;
		case 'local':
			applyLocalLine(line, context);
			return;
		case 'localSet': {
			const localPointer = applyLocalSetLine(line, facts, context);
			if (localPointer) {
				facts.localPointer = localPointer;
			}
			return;
		}
		case 'block':
			pushBlock(context, { blockType: BlockType.BLOCK, expectedResultTypes: getResultTypes(line) });
			return;
		case 'blockEnd':
		case 'ifEnd':
		case 'loopEnd':
			popBlock(context);
			return;
		case 'if':
			pushBlock(context, { blockType: BlockType.CONDITION, expectedResultTypes: getResultTypes(line) });
			return;
		case 'else': {
			const block = popBlock(context);
			if (block) {
				pushBlock(context, block);
			}
			return;
		}
		case 'loop':
			applyLoopLine(line, context);
			return;
		case 'mapBegin':
			applyMapBeginLine(line, context);
			return;
		case 'map':
			applyMapLine(line as ResolvedMapLine, context);
			return;
		case 'default':
			applyDefaultLine(line as ResolvedDefaultLine, context);
			return;
		case 'mapEnd':
			popBlock(context);
			return;
		case '#loopCap':
			context.loopCap = line.arguments[0].value as number;
			return;
		case '#skipExecution':
			context.skipExecutionInCycle = true;
			return;
		case '#impure':
			context.currentFunctionIsImpure = true;
			return;
		case '#export': {
			const exportName =
				line.arguments[0]?.type === ArgumentType.IDENTIFIER ? line.arguments[0].value : context.currentFunctionName;
			if (context.currentFunctionImport !== undefined) {
				throw getError(ErrorCode.IMPORT_EXPORT_CONFLICT, line, context);
			}
			if (context.currentFunctionExportName !== undefined) {
				throw getError(ErrorCode.DUPLICATE_EXPORT_NAME, line, context, { identifier: exportName });
			}
			context.currentFunctionExportName = exportName;
			return;
		}
		case '#import': {
			if (context.currentFunctionImport !== undefined) {
				throw getError(ErrorCode.DUPLICATE_FUNCTION_IMPORT, line, context);
			}
			if (context.currentFunctionExportName !== undefined) {
				throw getError(ErrorCode.IMPORT_EXPORT_CONFLICT, line, context);
			}
			context.currentFunctionImport = {
				moduleName: DEFAULT_HOST_IMPORT_MODULE_NAME,
				fieldName: line.arguments[0].value as string,
			};
			context.currentFunctionIsImpure = true;
			return;
		}
	}
}

function analyzeSemanticReferenceLine(
	line: SemanticReferenceLine,
	context: CompilationContext,
	options: { skipImportedFunctionEnd?: boolean } = {}
): StackAnalysisLineFacts | undefined {
	if (isSemanticInstructionLine(line)) {
		applySemanticLine(line, context);
		return undefined;
	}

	if (isMemoryDeclarationLine(line)) {
		return undefined;
	}

	const facts =
		options.skipImportedFunctionEnd && line.instruction === 'functionEnd'
			? createEmptyLineFacts(line, context)
			: analyzeInstruction(line, context);
	applyStackLineEffect(line, facts, context);
	return facts;
}

function createModuleContext(input: AnalyzeStackProjectInput, ast: ValidatedModuleAST): ModuleCompilationContext {
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

function analyzeModule(input: AnalyzeStackProjectInput, ast: ValidatedModuleAST): StackAnalyzedModule {
	const context = createModuleContext(input, ast);
	const semanticLineFacts = input.semanticReferences.modules[ast.id].lineFacts;
	const stackLineFacts: Array<StackAnalysisLineFacts | undefined> = [];
	const stackAnalysis: CompiledStackAnalysisLine[] = [];

	for (const [index, sourceLine] of ast.lines.entries()) {
		const line = { ...sourceLine, ...(semanticLineFacts[index] ?? {}) } as SemanticReferenceLine;
		const facts = analyzeSemanticReferenceLine(line, context);
		stackLineFacts.push(facts);
		if (facts) {
			stackAnalysis.push(toCompiledStackAnalysisLine(sourceLine, facts));
		}
	}

	if (context.stack.length > 0) {
		throw getError(ErrorCode.STACK_EXPECTED_ZERO_ELEMENTS, ast.lines[0], context);
	}

	return {
		lineFacts: stackLineFacts,
		stackAnalysis,
		finalStack: cloneStack(context.stack),
		...(context.skipExecutionInCycle ? { skipExecutionInCycle: true } : {}),
	};
}

function getFunctionMetadata(input: AnalyzeStackProjectInput, ast: ValidatedFunctionAST): FunctionMetadata {
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
	input: AnalyzeStackProjectInput,
	ast: ValidatedFunctionAST,
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

function analyzeFunction(input: AnalyzeStackProjectInput, ast: ValidatedFunctionAST): StackAnalyzedFunction {
	const functionMetadata = getFunctionMetadata(input, ast);
	const context = createFunctionContext(input, ast, functionMetadata);
	const semanticLineFacts = input.semanticReferences.functions[functionMetadata.id].lineFacts;
	const stackLineFacts: Array<StackAnalysisLineFacts | undefined> = [];
	const stackAnalysis: CompiledStackAnalysisLine[] = [];
	let functionBodyStarted = false;

	for (const [index, sourceLine] of ast.lines.entries()) {
		const line = { ...sourceLine, ...(semanticLineFacts[index] ?? {}) } as SemanticReferenceLine;
		if (ast.importLine && !isImportedFunctionDeclarationInstructionName(line.instruction)) {
			throw getError(
				line.instruction === '#export' ? ErrorCode.IMPORT_EXPORT_CONFLICT : ErrorCode.IMPORTED_FUNCTION_BODY,
				line,
				context
			);
		}
		if (functionBodyStarted && (line.instruction === 'param' || line.instruction === 'paramShape')) {
			throw getError(ErrorCode.PARAM_AFTER_FUNCTION_BODY, line, context);
		}

		const analyzedLine = analyzeSemanticReferenceLine(line, context, {
			skipImportedFunctionEnd: !!ast.importLine,
		});
		if (analyzedLine) {
			stackAnalysis.push(toCompiledStackAnalysisLine(sourceLine, analyzedLine));
		}
		stackLineFacts.push(analyzedLine);
		if (isFunctionBodyInstructionName(line.instruction)) {
			functionBodyStarted = true;
		}
	}

	return {
		functionId: functionMetadata.id,
		lineFacts: stackLineFacts,
		stackAnalysis,
		finalStack: cloneStack(context.stack),
		locals: { ...context.locals },
		parameterCount: context.currentFunctionParameterCount,
		...(context.currentFunctionExportName ? { exportName: context.currentFunctionExportName } : {}),
		...(context.currentFunctionImport ? { import: context.currentFunctionImport } : {}),
	};
}

export function analyzeStack(input: AnalyzeStackProjectInput): StackAnalysisProjectReport {
	const functionReports = Object.fromEntries(
		input.ast.functions.map(ast => {
			const report = analyzeFunction(input, ast);
			return [report.functionId, report];
		})
	);
	const modules = Object.fromEntries(input.ast.modules.map(ast => [ast.id, analyzeModule(input, ast)]));
	const usedFunctionIds = new Set<string>();
	for (const functionReport of Object.values(functionReports)) {
		if (functionReport.exportName) {
			usedFunctionIds.add(functionReport.functionId);
		}
		for (const facts of functionReport.lineFacts) {
			if (facts?.targetFunctionId) {
				usedFunctionIds.add(facts.targetFunctionId);
			}
		}
	}
	for (const moduleReport of Object.values(modules)) {
		for (const facts of moduleReport.lineFacts) {
			if (facts?.targetFunctionId) {
				usedFunctionIds.add(facts.targetFunctionId);
			}
		}
	}
	const functions = Object.fromEntries(
		Object.values(functionReports).map(functionReport => [
			functionReport.functionId,
			{
				...functionReport,
				...(usedFunctionIds.has(functionReport.functionId) ? { used: true } : {}),
			},
		])
	);

	return { modules, functions, usedFunctionIds: [...usedFunctionIds] };
}
