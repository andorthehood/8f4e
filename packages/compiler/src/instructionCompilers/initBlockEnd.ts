import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE } from '../types';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const initBlockEnd: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		const block = context.blockStack.pop();

		if (!block || block.blockType !== BLOCK_TYPE.INIT) {
			throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
		}

		return context;
	}
);

export default initBlockEnd;
