import compile, { compileCodegenLine, collectNamespacesFromASTs } from '@8f4e/compiler';
import {
	BLOCK_TYPE,
	compiledModuleBlockTypes,
	compilerSourceBlockInstructionByType,
	documentBlockInstructionByType,
	type AST,
	type CompileOptions,
	type CompilationContext,
	type CompilerSourceBlockType,
	type Module,
} from '@8f4e/compiler-spec';

import getBlockType from '../shared/getBlockType';

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

const compiledModuleBlockTypeSet = new Set<string>(compiledModuleBlockTypes);
const constantsInstruction = compilerSourceBlockInstructionByType.constants.start;
const constantsBlockType = compilerSourceBlockInstructionByType.constants.type;
const functionBlockType = compilerSourceBlockInstructionByType.function.type;
const moduleBlockType = compilerSourceBlockInstructionByType.module.type;
const macroBlockType = documentBlockInstructionByType.macro.type;

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

function pickProjectBlocks(project: ProjectInput): {
	moduleBlocks: Module[];
	functionBlocks: Module[];
	macroBlocks: Module[];
} {
	const moduleBlocks: Module[] = [];
	const functionBlocks: Module[] = [];
	const macroBlocks: Module[] = [];

	for (const block of project.codeBlocks) {
		if (block.disabled) {
			continue;
		}

		const blockType = getBlockType(block.code);
		if (compiledModuleBlockTypeSet.has(blockType)) {
			moduleBlocks.push({ code: block.code });
			continue;
		}

		if (blockType === functionBlockType) {
			functionBlocks.push({ code: block.code });
			continue;
		}

		if (blockType === macroBlockType) {
			macroBlocks.push({ code: block.code });
		}
	}

	return { moduleBlocks, functionBlocks, macroBlocks };
}

export default function traceInstructionFlow(
	project: ProjectInput,
	compilerOptions: CompileOptions
): InstructionFlowTrace {
	const { moduleBlocks, functionBlocks, macroBlocks } = pickProjectBlocks(project);

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
					blockType: kind === constantsBlockType ? BLOCK_TYPE.CONSTANTS : BLOCK_TYPE.MODULE,
				},
			],
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
					blockType: BLOCK_TYPE.FUNCTION,
				},
			],
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
