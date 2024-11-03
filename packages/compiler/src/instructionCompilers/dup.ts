import { ErrorCode, getError } from '../errors';
import { InstructionCompiler } from '../types';
import { isInstructionIsInsideAModule } from '../utils';
import { compileSegment } from '../compiler';

const dup: InstructionCompiler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	const tempName = '__dupTemp' + line.lineNumber;

	context.stack.push(operand);

	return compileSegment(
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
