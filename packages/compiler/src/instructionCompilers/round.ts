import { WASM_F32_NEAREST } from '@8f4e/compiler-wasm-utils';
import type { InstructionCompiler } from '@8f4e/language-spec';
import { saveByteCode } from './utils/saveByteCode';

/**
 * Instruction compiler for `round`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const round: InstructionCompiler = (line, context) => {
	return saveByteCode(context, [WASM_F32_NEAREST]);
};

export default round;
