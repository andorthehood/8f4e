import { ErrorCode, getError } from '../compilerError';
import { BLOCK_TYPE } from '../types';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `#initOnly` compiler directive.
 * Marks a module to execute once during init and skip execution in the cycle dispatcher.
 */
const initOnly: InstructionCompiler = function (line, context) {
	// Verify that we're within a module block
	const isInModuleBlock = context.blockStack.some(block => block.blockType === BLOCK_TYPE.MODULE);

	if (!isInModuleBlock) {
		throw getError(ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT, line, context);
	}

	// Set the metadata flag (idempotent - multiple calls have no additional effect)
	context.initOnlyExecution = true;

	return context;
};

export default initOnly;
