import { WASM_F32_NEAREST } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `round`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const round: InstructionCompiler = (line, context) => {
	return saveByteCode(context, [WASM_F32_NEAREST]);
};

export default round;
