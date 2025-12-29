import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `drop`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const drop: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		context.stack.pop();

		return saveByteCode(context, [WASMInstruction.DROP]);
	}
);

export default drop;
