import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { parseSegment } from '../compiler';

const dup: InstructionHandler = function (line, context) {
	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	const tempName = '__dupTemp' + line.lineNumber;

	context.stack.push(operand);

	return parseSegment(
		[
			`local ${operand.isInteger ? 'int' : 'float'} ${tempName}`,
			`localSet ${tempName}`,
			`localGet ${tempName}`,
			`localGet ${tempName}`,
		],
		context
	);
};

export default dup;
