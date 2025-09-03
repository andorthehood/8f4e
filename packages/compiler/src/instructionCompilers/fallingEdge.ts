import { ErrorCode, getError } from '../errors';
import type { InstructionCompiler } from '../types';
import { isInstructionIsInsideAModule } from '../utils';
import { compileSegment } from '../compiler';

const fallingEdge: InstructionCompiler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	context.stack.push({ isInteger: true, isNonZero: false });

	const currentValueName = '__fallingEdgeDetector_currentValue' + line.lineNumber;
	const previousValueName = '__fallingEdgeDetector_previousValue' + line.lineNumber;

	return compileSegment(
		[
			`int ${previousValueName} 0`,
			`local int ${currentValueName}`,
			`localSet ${currentValueName}`,
			`localGet ${currentValueName}`,
			`push &${previousValueName}`,
			'load',
			'lessThan',
			'if int',
			'push 1',
			'else',
			'push 0',
			'ifEnd',
			`push &${previousValueName}`,
			`localGet ${currentValueName}`,
			'store',
		],
		context
	);
};

export default fallingEdge;
