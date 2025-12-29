import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE } from '../types';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `moduleEnd`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const moduleEnd: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		const block = context.blockStack.pop();

		// Additional validation beyond withValidation's scope check:
		// withValidation ensures we're somewhere inside a module, but we need to verify
		// that the current block being closed is specifically a MODULE block
		if (!block || block.blockType !== BLOCK_TYPE.MODULE) {
			throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
		}

		return context;
	}
);

export default moduleEnd;
