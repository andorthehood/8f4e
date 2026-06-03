import type { AnalyzedLine, CompilationContext, CompilerASTLine, InstructionCompiler } from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';
import { WASM_IF, WASM_MEMORY_SIZE } from '@8f4e/compiler-wasm-utils';
import { expect } from 'vitest';
import { createCompilationContext } from '../semantic/createCompilationContext';
import { analyzeInstruction } from '../stackAnalysis/analyzeInstruction';

/**
 * Creates a compilation context fixture for instruction compiler tests.
 *
 * @param overrides - Context fields to override on the generated fixture.
 * @returns A compilation context with default module-scoped state.
 */
export default function createInstructionCompilerTestContext(
	overrides: Partial<CompilationContext> = {}
): CompilationContext {
	return createCompilationContext({
		...overrides,
		namespace: {
			moduleName: 'test',
			...overrides.namespace,
		},
		blockStack: overrides.blockStack ?? [
			{
				blockType: BlockType.MODULE,
				expectedResultTypes: [],
			},
		],
		codeBlockId: overrides.codeBlockId ?? 'test',
		codeBlockType: overrides.codeBlockType ?? 'module',
	});
}

/**
 * Runs stack analysis for a line and immediately compiles it with the provided compiler.
 *
 * @param compileInstruction - Instruction compiler under test.
 * @param line - Source AST line to analyze and compile.
 * @param context - Compilation context mutated by analysis and compilation.
 * @returns The updated compilation context.
 */
export function analyzeAndCompileInstruction<TLine extends CompilerASTLine>(
	compileInstruction: InstructionCompiler<TLine>,
	line: TLine,
	context: CompilationContext
): CompilationContext {
	compileInstruction(analyzeInstruction(line, context) as AnalyzedLine<TLine>, context);
	return context;
}

/**
 * Counts occurrences of one bytecode sequence inside another.
 *
 * @param haystack - Bytecode sequence to search.
 * @param needle - Bytecode subsequence to count.
 * @returns The number of matching subsequences.
 */
export function countByteCodeSequence(haystack: number[], needle: number[]): number {
	let count = 0;
	for (let i = 0; i <= haystack.length - needle.length; i++) {
		if (needle.every((value, index) => haystack[i + index] === value)) {
			count++;
		}
	}
	return count;
}

/**
 * Checks whether one bytecode sequence contains another.
 *
 * @param haystack - Bytecode sequence to search.
 * @param needle - Bytecode subsequence to find.
 * @returns True when the subsequence occurs at least once.
 */
export function containsByteCodeSequence(haystack: number[], needle: number[]): boolean {
	return countByteCodeSequence(haystack, needle) > 0;
}

/**
 * Asserts the bytecode shape emitted for guarded memory dereferences.
 *
 * @param byteCode - Compiled bytecode to inspect.
 * @param options - Expected prefix, final load sequence, guard count, and result type.
 * @returns Nothing.
 */
export function expectGuardedDereference(
	byteCode: number[],
	options: { prefix: number[]; finalLoad: number[]; guardCount: number; resultType: number }
): void {
	expect(byteCode.slice(0, options.prefix.length)).toEqual(options.prefix);
	expect(byteCode).toContain(WASM_MEMORY_SIZE);
	expect(containsByteCodeSequence(byteCode, options.finalLoad)).toBe(true);
	expect(countByteCodeSequence(byteCode, [WASM_IF, options.resultType])).toBe(options.guardCount);
}
