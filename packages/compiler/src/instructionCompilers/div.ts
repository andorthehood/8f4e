import { WASMInstruction } from '@8f4e/compiler-wasm-utils';
import { BASE_TYPE_METADATA, ErrorCode } from '@8f4e/compiler-spec';

import createNumericBinaryCompiler from './utils/createNumericBinaryCompiler';
import { deriveKnownIntegerValue } from './utils/knownIntegerValue';

import { getError } from '../compilerError';

/**
 * Instruction compiler for `div`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const div = createNumericBinaryCompiler({
	opcodes: {
		int32: WASMInstruction.I32_DIV_S,
		float32: WASMInstruction.F32_DIV,
		float64: WASMInstruction.F64_DIV,
	},
	result: 'numeric',
	validate: ({ right, line, context }) => {
		if (right.isNonZero) {
			return;
		}
		throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
	},
	deriveIntegerMetadata: (left, right) =>
		deriveKnownIntegerValue(left, right, (dividend, divisor) => {
			if (divisor === 0 || (dividend === BASE_TYPE_METADATA.int.min && divisor === -1)) {
				return undefined;
			}

			return Math.trunc(dividend / divisor) | 0;
		}),
});

export default div;
