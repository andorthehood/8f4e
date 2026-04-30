import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { deriveKnownIntegerValue } from '../utils/knownIntegerValue';
import { withValidation } from '../withValidation';

import type { InstructionCompiler, StackItem } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `remainder`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const remainder: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand1 = context.stack.pop()!;
		const operand2 = context.stack.pop()!;

		if (!operand1.isNonZero) {
			throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
		}

		const integerMetadata: Partial<StackItem> = deriveKnownIntegerValue(operand2, operand1, (dividend, divisor) => {
			if (divisor === 0) {
				return undefined;
			}

			return (dividend % divisor) | 0;
		});

		context.stack.push({
			isInteger: true,
			isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
			...integerMetadata,
		});
		return saveByteCode(context, [WASMInstruction.I32_REM_S]);
	}
);

export default remainder;
