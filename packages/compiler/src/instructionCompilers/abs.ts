import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `abs`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const abs: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		if (operand.isInteger) {
			context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });
			const valueName = '__absify_value' + line.lineNumberAfterMacroExpansion;

			return compileSegment(
				[
					`local int ${valueName}`,
					`localSet ${valueName}`,
					`push ${valueName}`,
					'push 0',
					'lessThan',
					'if',
					' push 0',
					` push ${valueName}`,
					' sub',
					'else',
					` push ${valueName}`,
					'ifEnd int',
				],
				context
			);
		} else {
			context.stack.push({
				isInteger: false,
				...(operand.isFloat64 ? { isFloat64: true } : {}),
				isNonZero: operand.isNonZero,
			});
			return saveByteCode(context, [operand.isFloat64 ? WASMInstruction.F64_ABS : WASMInstruction.F32_ABS]);
		}
	}
);

export default abs;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('abs instruction compiler', () => {
		it('emits F32_ABS for float operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: true });

			abs(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'abs',
					arguments: [],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('compiles int abs via segment instructions', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true });

			abs(
				{
					lineNumberBeforeMacroExpansion: 3,
					lineNumberAfterMacroExpansion: 3,
					instruction: 'abs',
					arguments: [],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
				locals: context.locals,
			}).toMatchSnapshot();
		});

		it('emits F64_ABS for float64 operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isFloat64: true, isNonZero: true });

			abs(
				{
					lineNumberBeforeMacroExpansion: 2,
					lineNumberAfterMacroExpansion: 2,
					instruction: 'abs',
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
