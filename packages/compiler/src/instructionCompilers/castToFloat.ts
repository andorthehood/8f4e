import { WASM_F32_CONVERT_I32_S } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `castToFloat`.
 * @see [Instruction docs](../../docs/instructions/conversion.md)
 */
const castToFloat: InstructionCompiler = (line, context) => {
	return saveByteCode(context, [WASM_F32_CONVERT_I32_S]);
};

export default castToFloat;
