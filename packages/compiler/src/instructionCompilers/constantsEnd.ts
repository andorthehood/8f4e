import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE } from '../types';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `constantsEnd`.
 */
const constantsEnd: InstructionCompiler = withValidation(
	{
		scope: 'constants',
		allowedInConstantsBlocks: true,
	},
	(line, context) => {
		const block = context.blockStack.pop();

		if (!block || block.blockType !== BLOCK_TYPE.CONSTANTS) {
			throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
		}

		return context;
	}
);

export default constantsEnd;
