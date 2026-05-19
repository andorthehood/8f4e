import compile, { compileCodegenLine, collectNamespacesFromASTs } from '@8f4e/compiler';
import { pickProjectCompilerBlocks } from '@8f4e/tokenizer';
import {
	BlockType,
	compilerSourceBlockInstructionByType,
	type AST,
	type CompileOptions,
	type CompilationContext,
	type CompilerSourceBlockType,
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
		if (item.isInteger) {
			return 'int';
		}

		return item.isFloat64 ? 'float64' : 'float32';
	});
}

function serializeArguments(line: AST[number]): InstructionTraceEntry['arguments'] {
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

const constantsInstruction = compilerSourceBlockInstructionByType.constants.start;
const constantsBlockType = compilerSourceBlockInstructionByType.constants.type;
const functionBlockType = compilerSourceBlockInstructionByType.function.type;
const moduleBlockType = compilerSourceBlockInstructionByType.module.type;

function traceAst(id: string, kind: BlockTrace['kind'], ast: AST, context: CompilationContext): BlockTrace {
	const entries: InstructionTraceEntry[] = [];

	for (const line of ast) {
		const stackBefore = serializeStack(context);
		const byteCodeOffset = context.byteCode.length;

		if (!line.isSemanticOnly && !line.isMemoryDeclaration) {
			compileCodegenLine(line, context);
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
	const { moduleBlocks, functionBlocks, macroBlocks } = pickProjectCompilerBlocks(project.codeBlocks);

	if (moduleBlocks.length === 0) {
		return {
			requiredMemoryBytes: 0,
			blocks: [],
		};
	}

	const compileResult = compile(
		moduleBlocks,
		{
			...compilerOptions,
			includeAST: true,
		},
		functionBlocks.length > 0 ? functionBlocks : undefined,
		macroBlocks.length > 0 ? macroBlocks : undefined
	);

	const compiledModules = Object.values(compileResult.compiledModules).sort((a, b) => a.index - b.index);
	const moduleAsts = compiledModules.map(module => module.ast).filter((ast): ast is AST => Array.isArray(ast));
	const namespaces = collectNamespacesFromASTs(moduleAsts);
	const blocks: BlockTrace[] = [];

	for (const module of compiledModules) {
		if (!module.ast) {
			continue;
		}

		const kind = module.ast.some(line => line.instruction === constantsInstruction)
			? constantsBlockType
			: moduleBlockType;
		const context: CompilationContext = {
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
			insideModuleBlock: kind === moduleBlockType,
			insideFunctionBlock: false,
			insideGenericBlock: false,
			insideLoopBlock: false,
			insideConditionBlock: false,
			insideConstantsBlock: kind === constantsBlockType,
			insideMapBlock: false,
			startingByteAddress: module.byteAddress,
			mode: moduleBlockType,
			codeBlockId: module.id,
			codeBlockType: kind,
			skipExecutionInCycle: module.skipExecutionInCycle,
			initOnlyExecution: module.initOnlyExecution,
		};

		blocks.push(traceAst(module.id, kind, module.ast, context));
	}

	for (const compiledFunction of Object.values(compileResult.compiledFunctions ?? {})) {
		if (!compiledFunction.ast) {
			continue;
		}

		const context: CompilationContext = {
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
			insideModuleBlock: false,
			insideFunctionBlock: true,
			insideGenericBlock: false,
			insideLoopBlock: false,
			insideConditionBlock: false,
			insideConstantsBlock: false,
			insideMapBlock: false,
			startingByteAddress: 0,
			mode: functionBlockType,
			codeBlockId: compiledFunction.id,
			codeBlockType: functionBlockType,
		};

		blocks.push(traceAst(compiledFunction.id, functionBlockType, compiledFunction.ast, context));
	}

	return {
		requiredMemoryBytes: compileResult.requiredMemoryBytes,
		blocks,
	};
}
