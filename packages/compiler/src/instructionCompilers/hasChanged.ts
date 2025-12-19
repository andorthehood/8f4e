import { ErrorCode, getError } from '../errors';
import { isInstructionIsInsideAModule } from '../utils';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const hasChanged: InstructionCompiler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	const currentValueName = '__hasChangedDetector_currentValue' + line.lineNumber;
	const previousValueName = '__hasChangedDetector_previousValue' + line.lineNumber;
	const memoryType = operand.isInteger ? 'int' : 'float';

	context.stack.push({ isInteger: operand.isInteger, isNonZero: false });

	return compileSegment(
		[
			`${memoryType} ${previousValueName} 0`,
			`local ${memoryType} ${currentValueName}`,
			`localSet ${currentValueName}`,
			`localGet ${currentValueName}`,
			`push &${previousValueName}`,
			operand.isInteger ? 'load' : 'loadFloat',
			'equal',
			'equalToZero',
			`push &${previousValueName}`,
			`localGet ${currentValueName}`,
			'store',
		],
		context
	);
};

export default hasChanged;
