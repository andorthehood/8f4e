import { ErrorCode, getError } from '../compilerError';
import { BLOCK_TYPE } from '../types';

import type { ImpureLine, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `#impure` compiler directive.
 * Marks a function as allowed to perform explicit memory IO.
 */
const impure: InstructionCompiler<ImpureLine> = function (line, context) {
	const isInFunctionBlock = context.blockStack.some(block => block.blockType === BLOCK_TYPE.FUNCTION);

	if (!isInFunctionBlock) {
		throw getError(ErrorCode.IMPURE_DIRECTIVE_INVALID_CONTEXT, line, context);
	}

	context.currentFunctionIsImpure = true;

	return context;
};

export default impure;
