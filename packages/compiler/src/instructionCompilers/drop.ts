import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '@8f4e/compiler-types';

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
