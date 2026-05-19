import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';

import type { ImpureLine, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `#impure` compiler directive.
 * Marks a function as allowed to perform explicit memory IO.
 */
const impure: InstructionCompiler<ImpureLine> = function (line, context) {
	if (!context.insideFunctionBlock) {
		throw getError(ErrorCode.IMPURE_DIRECTIVE_INVALID_CONTEXT, line, context);
	}

	context.currentFunctionIsImpure = true;

	return context;
};

export default impure;
