import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { parseSegment } from '../compiler';

const dup: InstructionHandler = function (line, context) {
	const operand1 = context.stack.pop();
	const operand2 = context.stack.pop();

	if (!operand1 || !operand2) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	const tempAName = '__swapTempA' + line.lineNumber;
	const tempBName = '__swapTempB' + line.lineNumber;

	context.stack.push(operand2);
	context.stack.push(operand1);

	return parseSegment(
		[
			`local ${operand1.isInteger ? 'int' : 'float'} ${tempAName}`,
			`local ${operand2.isInteger ? 'int' : 'float'} ${tempBName}`,
			`localSet ${tempAName}`,
			`localSet ${tempBName}`,
			`localGet ${tempAName}`,
			`localGet ${tempBName}`,
		],
		context
	);
};

export default dup;
