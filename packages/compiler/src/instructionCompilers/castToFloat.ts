import { WASM_F32_CONVERT_I32_S } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `castToFloat`.
 * @see [Instruction docs](../../docs/instructions/conversion.md)
 */
const castToFloat: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 1 operand exists
	const operand = context.stack.pop()!;

	context.stack.push({ isInteger: false, isNonZero: operand.isNonZero });

	return saveByteCode(context, [WASM_F32_CONVERT_I32_S]);
};

export default castToFloat;
