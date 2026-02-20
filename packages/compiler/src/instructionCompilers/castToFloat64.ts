import createInstructionCompilerTestContext from '../utils/testUtils';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { parseLine } from '../compiler';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `castToFloat64`.
 * Casts int32 and float32 values to float64. Float64 input is a no-op.
 * @see [Instruction docs](../../docs/instructions/conversion.md)
 */
const castToFloat64: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push({ isInteger: false, isFloat64: true, isNonZero: operand.isNonZero });

		if (operand.isInteger) {
			return saveByteCode(context, [WASMInstruction.F64_CONVERT_I32_S]);
		}

		// Float64 input needs no opcode conversion.
		if (operand.isFloat64) {
			return context;
		}

		return saveByteCode(context, [WASMInstruction.F64_PROMOTE_F32]);
	}
);

export default castToFloat64;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('castToFloat64 instruction compiler', () => {
		it('converts int operand to float64', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true });

			castToFloat64(parseLine('castToFloat64', 1), context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('promotes float32 operand to float64', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: true });

			castToFloat64(parseLine('castToFloat64', 1), context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('is a no-op for float64 operand', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isFloat64: true, isNonZero: true });

			castToFloat64(parseLine('castToFloat64', 1), context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
