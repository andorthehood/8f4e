import { br } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { BranchLine, InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `branch`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branch: InstructionCompiler<BranchLine> = withValidation<BranchLine>(
	{
		scope: 'moduleOrFunction',
	},
	(line: BranchLine, context) => {
		return saveByteCode(context, br(line.arguments[0].value));
	}
);

export default branch;
