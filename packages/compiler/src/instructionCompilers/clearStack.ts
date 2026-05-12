import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `clearStack`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const clearStack: InstructionCompiler = (line, context) => {
	const length = context.stack.length;
	context.stack = [];

	return saveByteCode(context, new Array(length).fill(WASMInstruction.DROP));
};

export default clearStack;
