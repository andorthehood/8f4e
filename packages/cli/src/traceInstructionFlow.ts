import compile, {
	collectConstants,
	getConstantsName,
	getModuleName,
	instructions,
	type AST,
	type CompileOptions,
	type CompilationContext,
	type Module,
	type Namespaces,
} from '@8f4e/compiler';

import getBlockType from './shared/getBlockType';

import type { ProjectInput } from './shared/types';

export interface InstructionTraceEntry {
	lineNumber: number;
	instruction: string;
	arguments: Array<{
		type: 'literal' | 'identifier' | 'string_literal';
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
	kind: 'module' | 'function' | 'constants';
	entries: InstructionTraceEntry[];
}

export interface InstructionFlowTrace {
	memorySizeBytes: number;
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

		return {
			type: 'literal' as const,
			value: argument.value,
			isInteger: argument.isInteger,
			...(argument.isFloat64 ? { isFloat64: true } : {}),
		};
	});
}

function traceAst(id: string, kind: BlockTrace['kind'], ast: AST, context: CompilationContext): BlockTrace {
	const entries: InstructionTraceEntry[] = [];

	for (const line of ast) {
		const compiler = instructions[line.instruction];
		if (!compiler) {
			continue;
		}

		const stackBefore = serializeStack(context);
		const byteCodeOffset = context.byteCode.length;

		compiler(line, context);

		entries.push({
			lineNumber: line.lineNumber + 1,
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

function collectNamespaces(moduleAsts: AST[]): Namespaces {
	return Object.fromEntries(
		moduleAsts.map(ast => {
			const isConstantsBlock = ast.some(line => line.instruction === 'constants');
			const name = isConstantsBlock ? getConstantsName(ast) : getModuleName(ast);

			return [name, { consts: collectConstants(ast) }];
		})
	);
}

function pickProjectBlocks(project: ProjectInput): { moduleBlocks: Module[]; functionBlocks: Module[] } {
	const moduleBlocks: Module[] = [];
	const functionBlocks: Module[] = [];

	for (const block of project.codeBlocks) {
		if (block.disabled) {
			continue;
		}

		const blockType = getBlockType(block.code);
		if (blockType === 'module' || blockType === 'constants') {
			moduleBlocks.push({ code: block.code });
			continue;
		}

		if (blockType === 'function') {
			functionBlocks.push({ code: block.code });
		}
	}

	return { moduleBlocks, functionBlocks };
}

export default function traceInstructionFlow(
	project: ProjectInput,
	compilerOptions: CompileOptions
): InstructionFlowTrace {
	const { moduleBlocks, functionBlocks } = pickProjectBlocks(project);

	if (moduleBlocks.length === 0) {
		return {
			memorySizeBytes: compilerOptions.memorySizeBytes,
			blocks: [],
		};
	}

	const compileResult = compile(
		moduleBlocks,
		{
			...compilerOptions,
			includeAST: true,
		},
		functionBlocks.length > 0 ? functionBlocks : undefined
	);

	const compiledModules = Object.values(compileResult.compiledModules).sort((a, b) => a.index - b.index);
	const moduleAsts = compiledModules.map(module => module.ast).filter((ast): ast is AST => Array.isArray(ast));
	const namespaces = collectNamespaces(moduleAsts);
	const blocks: BlockTrace[] = [];

	for (const module of compiledModules) {
		if (!module.ast) {
			continue;
		}

		const context: CompilationContext = {
			namespace: {
				namespaces,
				memory: {},
				locals: {},
				consts: {},
				moduleName: undefined,
				functions: compileResult.compiledFunctions,
			},
			byteCode: [],
			stack: [],
			blockStack: [],
			startingByteAddress: module.byteAddress,
			memoryByteSize: compilerOptions.memorySizeBytes,
			mode: 'module',
		};

		const kind = module.ast.some(line => line.instruction === 'constants') ? 'constants' : 'module';
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
				locals: {},
				consts: {},
				moduleName: undefined,
				functions: compileResult.compiledFunctions,
			},
			byteCode: [],
			stack: [],
			blockStack: [],
			startingByteAddress: 0,
			memoryByteSize: compilerOptions.memorySizeBytes,
			mode: 'function',
		};

		blocks.push(traceAst(compiledFunction.id, 'function', compiledFunction.ast, context));
	}

	return {
		memorySizeBytes: compilerOptions.memorySizeBytes,
		blocks,
	};
}
