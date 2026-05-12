import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `drop`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const drop: InstructionCompiler = (line, context) => {
	context.stack.pop();

	return saveByteCode(context, [WASMInstruction.DROP]);
};

export default drop;
