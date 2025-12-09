import { ErrorCode, getError } from '../errors';
import { isInstructionInsideModuleOrFunction } from '../utils';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const pow2: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideModuleOrFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (!operand.isInteger) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, context);
	}

	context.stack.push({ isInteger: true, isNonZero: false });

	return compileSegment(['push 2', 'push 1', 'sub', 'swap', 'shiftLeft'], context);
};

export default pow2;
