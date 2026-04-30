import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { areAllOperandsFloat64, areAllOperandsIntegers, hasMixedFloatWidth } from '../utils/operandTypes';
import { deriveAddStackMetadata } from '../utils/stackAddressMetadata';
import { withValidation } from '../withValidation';

import type { InstructionCompiler, StackItem } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `add`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const add: InstructionCompiler = withValidation(
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
		const integerMetadata: Partial<StackItem> = isInteger ? deriveAddStackMetadata(operand1, operand2) : {};

		context.stack.push({
			isInteger,
			...(isFloat64 ? { isFloat64: true } : {}),
			isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
			...integerMetadata,
		});
		return saveByteCode(context, [
			isInteger ? WASMInstruction.I32_ADD : isFloat64 ? WASMInstruction.F64_ADD : WASMInstruction.F32_ADD,
		]);
	}
);

export default add;
