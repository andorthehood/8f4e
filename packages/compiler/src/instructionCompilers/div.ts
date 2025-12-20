import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers, saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const div: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'matching',
		onInvalidTypes: ErrorCode.UNMATCHING_OPERANDS,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand1 = context.stack.pop()!;
		const operand2 = context.stack.pop()!;

		if (!operand1.isNonZero) {
			throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
		}

		const isInteger = areAllOperandsIntegers(operand1, operand2);
		context.stack.push({ isInteger, isNonZero: true });
		return saveByteCode(context, [isInteger ? WASMInstruction.I32_DIV_S : WASMInstruction.F32_DIV]);
	}
);

export default div;
