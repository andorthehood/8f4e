import { ErrorCode, getError } from '../errors';
import { InstructionHandler } from '../types';
import { isInstructionIsInsideAModule } from '../utils';
import { parseSegment } from '../compiler';

const cycle: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operandEndPosition = context.stack.pop();
	const operandStartPosition = context.stack.pop();
	const operandPointer = context.stack.pop();

	if (!operandEndPosition || !operandStartPosition || !operandPointer) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (!operandEndPosition.isInteger || !operandStartPosition.isInteger || !operandPointer.isInteger) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, context);
	}

	context.stack.push({ isInteger: true, isNonZero: false });
	context.stack.push({ isInteger: true, isNonZero: false });
	context.stack.push({ isInteger: true, isNonZero: false });

	const pointerName = '__pointerCycle_pointerToIncrement' + line.lineNumber;
	const startPositionName = '__pointerCycle_startPosition' + line.lineNumber;
	const endPositionName = '__pointerCycle_endPosition' + line.lineNumber;

	return parseSegment(
		[
			`local int ${pointerName}`,
			`local int ${startPositionName}`,
			`local int ${endPositionName}`,

			`localSet ${endPositionName}`,
			`localSet ${startPositionName}`,
			`localSet ${pointerName}`,

			`localGet ${pointerName}`,
			`localGet ${pointerName}`,
			`load`,
			'push WORD_SIZE',
			'add',
			'store',

			`localGet ${pointerName}`,
			'load',
			`localGet ${endPositionName}`,
			'greaterThan',
			'if void',
			` localGet ${pointerName}`,
			` localGet ${startPositionName}`,
			` store`,
			'ifEnd',
		],
		context
	);
};

export default cycle;
