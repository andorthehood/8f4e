import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `#initOnly` compiler directive.
 * Marks a module to execute once during init and skip execution in the cycle dispatcher.
 */
const initOnly: InstructionCompiler = function (line, context) {
	if (!context.insideModuleBlock) {
		throw getError(ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT, line, context);
	}

	// Set the metadata flag (idempotent - multiple calls have no additional effect)
	context.initOnlyExecution = true;

	return context;
};

export default initOnly;
