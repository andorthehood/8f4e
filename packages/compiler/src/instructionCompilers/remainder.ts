import { WASM_I32_REM_S } from '@8f4e/compiler-wasm-utils';
import { ErrorCode } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';
import { deriveKnownIntegerValue } from './utils/knownIntegerValue';

import { getError } from '../compilerError';

import type { InstructionCompiler, StackItem } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `remainder`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const remainder: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 2 operands exist
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
	return saveByteCode(context, [WASM_I32_REM_S]);
};

export default remainder;
