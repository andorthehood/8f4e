import { BLOCK_TYPE } from '@8f4e/compiler-types';

import { ErrorCode, getError } from '../compilerError';

import type { ImpureLine, InstructionCompiler } from '@8f4e/compiler-types';

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
