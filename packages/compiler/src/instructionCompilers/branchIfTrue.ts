import { br_if } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { BranchIfTrueLine, InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `branchIfTrue`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branchIfTrue: InstructionCompiler<BranchIfTrueLine> = withValidation<BranchIfTrueLine>(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line: BranchIfTrueLine, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;
		return saveByteCode(context, br_if(line.arguments[0].value));
	}
);

export default branchIfTrue;
