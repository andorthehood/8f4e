import { areAllOperandsIntegers, saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `mul`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const mul: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'matching',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand2 = context.stack.pop()!;
		const operand1 = context.stack.pop()!;

		const isInteger = areAllOperandsIntegers(operand1, operand2);
		context.stack.push({ isInteger, isNonZero: false });
		return saveByteCode(context, [isInteger ? WASMInstruction.I32_MUL : WASMInstruction.F32_MUL]);
	}
);

export default mul;
