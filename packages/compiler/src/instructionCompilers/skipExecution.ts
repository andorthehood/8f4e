import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `#skipExecution` compiler directive.
 * Marks a module to skip execution in the cycle dispatcher while preserving
 * normal compilation and memory initialization behavior.
 */
const skipExecution: InstructionCompiler = function (line, context) {
	if (!context.insideModuleBlock) {
		throw getError(ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT, line, context);
	}

	// Set the metadata flag (idempotent - multiple calls have no additional effect)
	context.skipExecutionInCycle = true;

	return context;
};

export default skipExecution;
