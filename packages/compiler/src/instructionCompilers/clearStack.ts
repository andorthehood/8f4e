import { WASM_DROP } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `clearStack`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const clearStack: InstructionCompiler = (line, context) => {
	const length = context.stack.length;
	context.stack = [];

	return saveByteCode(context, new Array(length).fill(WASM_DROP));
};

export default clearStack;
