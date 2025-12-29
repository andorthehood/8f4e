import { BLOCK_TYPE } from '../types';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `initBlock`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const initBlock: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.INIT,
		});

		return context;
	}
);

export default initBlock;
