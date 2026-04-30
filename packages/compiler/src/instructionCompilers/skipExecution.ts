import { BLOCK_TYPE } from '@8f4e/compiler-types';

import { ErrorCode, getError } from '../compilerError';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `#skipExecution` compiler directive.
 * Marks a module to skip execution in the cycle dispatcher while preserving
 * normal compilation and memory initialization behavior.
 */
const skipExecution: InstructionCompiler = function (line, context) {
	// Verify that we're within a module block
	const isInModuleBlock = context.blockStack.some(block => block.blockType === BLOCK_TYPE.MODULE);

	if (!isInModuleBlock) {
		throw getError(ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT, line, context);
	}

	// Set the metadata flag (idempotent - multiple calls have no additional effect)
	context.skipExecutionInCycle = true;

	return context;
};

export default skipExecution;
