import { areAllOperandsIntegers, saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const greaterOrEqualUnsigned: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'matching',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand2 = context.stack.pop()!;
		const operand1 = context.stack.pop()!;

		if (areAllOperandsIntegers(operand1, operand2)) {
			context.stack.push({ isInteger: true, isNonZero: false });
			return saveByteCode(context, [WASMInstruction.I32_GE_U]);
		} else {
			context.stack.push({ isInteger: true, isNonZero: false });
			return saveByteCode(context, [WASMInstruction.F32_GE]);
		}
	}
);

export default greaterOrEqualUnsigned;
