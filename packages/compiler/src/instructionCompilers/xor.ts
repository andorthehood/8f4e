import type { InstructionCompiler } from '@8f4e/compiler-spec';
import { WASM_I32_XOR } from '@8f4e/compiler-wasm-utils';
import { saveByteCode } from './utils/saveByteCode';

/**
 * Instruction compiler for `xor`.
 * @see [Instruction docs](../../docs/instructions/bitwise.md)
 */
const xor: InstructionCompiler = (line, context) => {
	return saveByteCode(context, [WASM_I32_XOR]);
};

export default xor;
