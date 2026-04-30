import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { deriveKnownIntegerValue, I32_MIN } from '../utils/knownIntegerValue';
import { areAllOperandsFloat64, areAllOperandsIntegers, hasMixedFloatWidth } from '../utils/operandTypes';
import { withValidation } from '../withValidation';

import type { InstructionCompiler, StackItem } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `div`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const div: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'matching',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand1 = context.stack.pop()!;
		const operand2 = context.stack.pop()!;

		if (!operand1.isNonZero) {
			throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
		}

		if (hasMixedFloatWidth(operand1, operand2)) {
			throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
		}

		const isInteger = areAllOperandsIntegers(operand1, operand2);
		const isFloat64 = areAllOperandsFloat64(operand1, operand2);
		const integerMetadata: Partial<StackItem> = isInteger
			? deriveKnownIntegerValue(operand2, operand1, (dividend, divisor) => {
					if (divisor === 0 || (dividend === I32_MIN && divisor === -1)) {
						return undefined;
					}

					return Math.trunc(dividend / divisor) | 0;
				})
			: {};

		context.stack.push({
			isInteger,
			...(isFloat64 ? { isFloat64: true } : {}),
			isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
			...integerMetadata,
		});
		return saveByteCode(context, [
			isInteger ? WASMInstruction.I32_DIV_S : isFloat64 ? WASMInstruction.F64_DIV : WASMInstruction.F32_DIV,
		]);
	}
);

export default div;
