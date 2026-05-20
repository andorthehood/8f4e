import { WASM_I32_OR } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `or`.
 * @see [Instruction docs](../../docs/instructions/bitwise.md)
 */
const or: InstructionCompiler = (line, context) => {
	return saveByteCode(context, [WASM_I32_OR]);
};

export default or;
