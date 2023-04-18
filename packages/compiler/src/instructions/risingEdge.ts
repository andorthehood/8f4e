import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { parseSegment } from '../compiler';

const risingEdge: InstructionHandler = function (line, context) {
	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	context.stack.push({ isInteger: true });

	const currentValueName = '__risingEdgeDetector_currentValue' + line.lineNumber;
	const previousValueName = '__risingEdgeDetector_previousValue' + line.lineNumber;

	return parseSegment(
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
			'end',
			`push &${previousValueName}`,
			`localGet ${currentValueName}`,
			'store',
		],
		context
	);
};

export default risingEdge;
