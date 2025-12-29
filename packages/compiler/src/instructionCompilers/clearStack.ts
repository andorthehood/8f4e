import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `clearStack`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const clearStack: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		const length = context.stack.length;
		context.stack = [];

		return saveByteCode(context, new Array(length).fill(WASMInstruction.DROP));
	}
);

export default clearStack;
