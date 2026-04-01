import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import { i32load, i32load16s, i32load16u, i32load8s, i32load8u } from '@8f4e/compiler-wasm-utils';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `load` variants.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const instructionToByteCodeMap: Record<string, number[]> = {
	load: i32load(),
	load8s: i32load8s(),
	load8u: i32load8u(),
	load16s: i32load16s(),
	load16u: i32load16u(),
};

const load: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		context.stack.pop();
		context.stack.push({ isInteger: true, isNonZero: false });
		const instructions = instructionToByteCodeMap[line.instruction];
		if (!instructions) {
			throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
		}
		return saveByteCode(context, instructions);
	}
);

export default load;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('load instruction compiler', () => {
		it('loads from a safe memory address', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false, isSafeMemoryAddress: true });

			load(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'load',
					arguments: [],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('loads from an unsafe memory address without extra bounds checks', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false, isSafeMemoryAddress: false });

			load(
				{
					lineNumberBeforeMacroExpansion: 2,
					lineNumberAfterMacroExpansion: 2,
					instruction: 'load8u',
					arguments: [],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
