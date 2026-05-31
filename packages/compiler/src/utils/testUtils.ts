import type { AnalyzedLine, CompilationContext, CompilerASTLine, InstructionCompiler } from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';
import { WASM_IF, WASM_MEMORY_SIZE } from '@8f4e/compiler-wasm-utils';
import { expect } from 'vitest';
import { createCompilationContext } from '../semantic/createCompilationContext';
import { analyzeInstruction } from '../stackAnalysis/analyzeInstruction';

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

export function analyzeAndCompileInstruction<TLine extends CompilerASTLine>(
	compileInstruction: InstructionCompiler<TLine>,
	line: TLine,
	context: CompilationContext
): CompilationContext {
	compileInstruction(analyzeInstruction(line, context) as AnalyzedLine<TLine>, context);
	return context;
}

export function countByteCodeSequence(haystack: number[], needle: number[]): number {
	let count = 0;
	for (let i = 0; i <= haystack.length - needle.length; i++) {
		if (needle.every((value, index) => haystack[i + index] === value)) {
			count++;
		}
	}
	return count;
}

export function containsByteCodeSequence(haystack: number[], needle: number[]): boolean {
	return countByteCodeSequence(haystack, needle) > 0;
}

export function expectGuardedDereference(
	byteCode: number[],
	options: { prefix: number[]; finalLoad: number[]; guardCount: number; resultType: number }
): void {
	expect(byteCode.slice(0, options.prefix.length)).toEqual(options.prefix);
	expect(byteCode).toContain(WASM_MEMORY_SIZE);
	expect(containsByteCodeSequence(byteCode, options.finalLoad)).toBe(true);
	expect(countByteCodeSequence(byteCode, [WASM_IF, options.resultType])).toBe(options.guardCount);
}
