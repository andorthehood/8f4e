import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { parseSegment } from '../compiler';
import { isInstructionIsInsideAModule } from '../utils';

const fallingEdge: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	context.stack.push({ isInteger: true });

	const currentValueName = '__fallingEdgeDetector_currentValue' + line.lineNumber;
	const previousValueName = '__fallingEdgeDetector_previousValue' + line.lineNumber;

	return parseSegment(
		[
			`int ${previousValueName} 0`,
			`local int ${currentValueName}`,
			`localSet ${currentValueName}`,
			`localGet ${currentValueName}`,
			`push &${previousValueName}`,
			'load',
			'greaterThan',
			'if int',
			'push 1',
			'else',
			'push 0',
			'end',
			`push &${previousValueName}`,
			`localGet ${currentValueName}`,
			'store',
		],
		context
	);
};

export default fallingEdge;
