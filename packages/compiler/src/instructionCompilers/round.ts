import { WASM_F32_NEAREST } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `round`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const round: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 1 operand exists
	context.stack.pop()!;

	context.stack.push({ isInteger: false, isNonZero: false });

	return saveByteCode(context, [WASM_F32_NEAREST]);
};

export default round;
