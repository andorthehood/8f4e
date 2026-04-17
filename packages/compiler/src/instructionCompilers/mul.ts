import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { areAllOperandsFloat64, areAllOperandsIntegers, hasMixedFloatWidth } from '../utils/operandTypes';
import { withValidation } from '../withValidation';

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

		if (hasMixedFloatWidth(operand1, operand2)) {
			throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
		}

		const isInteger = areAllOperandsIntegers(operand1, operand2);
		const isFloat64 = areAllOperandsFloat64(operand1, operand2);

		context.stack.push({
			isInteger,
			...(isFloat64 ? { isFloat64: true } : {}),
			isNonZero: false,
		});
		return saveByteCode(context, [
			isInteger ? WASMInstruction.I32_MUL : isFloat64 ? WASMInstruction.F64_MUL : WASMInstruction.F32_MUL,
		]);
	}
);

export default mul;
