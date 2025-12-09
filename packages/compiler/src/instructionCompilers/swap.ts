import { ErrorCode, getError } from '../errors';
import { isInstructionInsideModuleOrFunction } from '../utils';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const dup: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideModuleOrFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand1 = context.stack.pop();
	const operand2 = context.stack.pop();

	if (!operand1 || !operand2) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	const tempAName = '__swapTempA' + line.lineNumber;
	const tempBName = '__swapTempB' + line.lineNumber;

	context.stack.push(operand2);
	context.stack.push(operand1);

	return compileSegment(
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
