import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import { f32load } from '@8f4e/compiler-wasm-utils';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `loadFloat`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const loadFloat: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		context.stack.pop();
		context.stack.push({ isInteger: false, isNonZero: false });
		return saveByteCode(context, f32load());
	}
);

export default loadFloat;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('loadFloat instruction compiler', () => {
		it('loads from a safe memory address', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false, isSafeMemoryAddress: true });

			loadFloat(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'loadFloat',
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

			loadFloat(
				{
					lineNumberBeforeMacroExpansion: 2,
					lineNumberAfterMacroExpansion: 2,
					instruction: 'loadFloat',
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
