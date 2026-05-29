import compile, {
	analyzeInstruction,
	compileCodegenLine,
	collectNamespacesFromASTs,
	createCompilationContext,
	normalizeCompileTimeArguments,
} from '@8f4e/compiler';
import { pickProjectCompilerBlocks } from '@8f4e/tokenizer';
import {
	BlockType,
	isMemoryDeclarationLine,
	isSemanticInstructionLine,
	type ConstantsAST,
	type CompilerASTLine,
	type CompilerASTLines,
	type CompileOptions,
	type CompilationContext,
	type CompilerSourceBlockType,
	type ModuleAST,
} from '@8f4e/compiler-spec';

import type { ProjectInput } from '../shared/types';

export interface InstructionTraceEntry {
	lineNumber: number;
	instruction: string;
	arguments: Array<{
		type: 'literal' | 'identifier' | 'string_literal' | 'compile_time_expression';
		value: number | string;
		isInteger?: boolean;
		isFloat64?: boolean;
	}>;
	stackBefore: string[];
	stackAfter: string[];
	emittedByteCode: number[];
}

export interface BlockTrace {
	id: string;
	kind: CompilerSourceBlockType;
	entries: InstructionTraceEntry[];
}

export interface InstructionFlowTrace {
	requiredMemoryBytes: number;
	blocks: BlockTrace[];
}

function serializeStack(context: CompilationContext): string[] {
	return context.stack.map(item => {
		if (item.kind === 'address') {
			return 'address';
		}

		const valueType = item.valueType;
		return valueType === 'float64' ? 'float64' : valueType === 'float' ? 'float32' : 'int';
	});
}

function serializeArguments(line: CompilerASTLine): InstructionTraceEntry['arguments'] {
	return line.arguments.map(argument => {
		if (argument.type === 'identifier') {
			return {
				type: 'identifier' as const,
				value: argument.value,
			};
		}

		if (argument.type === 'string_literal') {
			return {
				type: 'string_literal' as const,
				value: argument.value,
			};
		}

		if (argument.type === 'compile_time_expression') {
			return {
				type: 'compile_time_expression' as const,
				value: `${argument.left.value}${argument.operator}${argument.right.value}`,
			};
		}

		return {
			type: 'literal' as const,
			value: argument.value,
			isInteger: argument.isInteger,
			...(argument.isFloat64 ? { isFloat64: true } : {}),
		};
	});
}

const constantsBlockType = 'constants';
const functionBlockType = 'function';
const moduleBlockType = 'module';

function traceAst(
	id: string,
	kind: BlockTrace['kind'],
	ast: CompilerASTLines,
	context: CompilationContext
): BlockTrace {
	const entries: InstructionTraceEntry[] = [];

	for (const originalLine of ast) {
		const line = normalizeCompileTimeArguments(originalLine, context);
		const stackBefore = serializeStack(context);
		const byteCodeOffset = context.byteCode.length;

		if (!isSemanticInstructionLine(line) && !isMemoryDeclarationLine(line)) {
			compileCodegenLine(analyzeInstruction(line, context), context);
		}

		entries.push({
			lineNumber: line.lineNumberBeforeMacroExpansion + 1,
			instruction: line.instruction,
			arguments: serializeArguments(line),
			stackBefore,
			stackAfter: serializeStack(context),
			emittedByteCode: context.byteCode.slice(byteCodeOffset) as number[],
		});
	}

	return {
		id,
		kind,
		entries,
	};
}

export default function traceInstructionFlow(
	project: ProjectInput,
	compilerOptions: CompileOptions
): InstructionFlowTrace {
	const { groups, constantsBlocks, functionBlocks, macroBlocks } = pickProjectCompilerBlocks(project.codeBlocks);

	if (groups.main.length === 0 && constantsBlocks.length === 0) {
		return {
			requiredMemoryBytes: 0,
			blocks: [],
		};
	}

	const compileResult = compile(
		{
			groups,
			constants: constantsBlocks,
			functions: functionBlocks,
			macros: macroBlocks,
		},
		{
			...compilerOptions,
			includeAST: true,
		}
	);

	const compiledModules = Object.values(compileResult.compiledModules).sort((a, b) => a.index - b.index);
	const moduleAsts = compiledModules
		.map(module => module.ast)
		.filter((ast): ast is ModuleAST | ConstantsAST => ast !== undefined);
	const namespaces = collectNamespacesFromASTs(
		moduleAsts,
		undefined,
		compileResult.compiledFunctions,
		moduleAsts,
		compilerOptions
	);
	const blocks: BlockTrace[] = [];

	for (const module of compiledModules) {
		if (!module.ast) {
			continue;
		}

		const kind = module.ast.type;
		const context = createCompilationContext({
			namespace: {
				namespaces,
				memory: module.memoryMap,
				consts: { ...(namespaces[module.id]?.consts ?? {}) },
				moduleName: module.id,
				functions: compileResult.compiledFunctions,
			},
			locals: {},
			internalResources: {},
			internalAllocator: {
				nextByteAddress: compileResult.requiredMemoryBytes,
			},
			byteCode: [],
			stack: [],
			blockStack: [
				{
					hasExpectedResult: false,
					expectedResultIsInteger: false,
					blockType: kind === constantsBlockType ? BlockType.CONSTANTS : BlockType.MODULE,
				},
			],
			startingByteAddress: module.byteAddress,
			currentMemoryIndex: module.memoryIndex,
			...(module.memoryRegionName ? { currentMemoryRegionName: module.memoryRegionName } : {}),
			memoryRegions: compilerOptions.memoryRegions ?? [],
			mode: moduleBlockType,
			codeBlockId: module.id,
			codeBlockType: kind,
			skipExecutionInCycle: module.skipExecutionInCycle,
			initOnlyExecution: module.initOnlyExecution,
		});

		blocks.push(traceAst(module.id, kind, module.ast.lines, context));
	}

	for (const compiledFunction of Object.values(compileResult.compiledFunctions ?? {})) {
		if (!compiledFunction.ast) {
			continue;
		}

		const context = createCompilationContext({
			namespace: {
				namespaces,
				memory: {},
				consts: {},
				moduleName: undefined,
				functions: compileResult.compiledFunctions,
			},
			locals: {},
			internalResources: {},
			internalAllocator: {
				nextByteAddress: compileResult.requiredMemoryBytes,
			},
			byteCode: [],
			stack: [],
			blockStack: [
				{
					hasExpectedResult: false,
					expectedResultIsInteger: false,
					blockType: BlockType.FUNCTION,
				},
			],
			startingByteAddress: 0,
			currentMemoryIndex: 0,
			memoryRegions: compilerOptions.memoryRegions ?? [],
			mode: functionBlockType,
			codeBlockId: compiledFunction.id,
			codeBlockType: functionBlockType,
		});

		blocks.push(traceAst(compiledFunction.id, functionBlockType, compiledFunction.ast.lines, context));
	}

	return {
		requiredMemoryBytes: compileResult.requiredMemoryBytes,
		blocks,
	};
}
