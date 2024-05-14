import { ErrorCode, getError } from '../errors';
import { InstructionHandler } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { isInstructionIsInsideAModule } from '../utils';

const ifEnd: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();

	if (!block || !block.isConditionBlock) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}

	if (block.hasExpectedResult) {
		const operand = context.stack.pop();

		if (!operand) {
			throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
		}

		if (block.expectedResultIsInteger && !operand.isInteger) {
			throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, context);
		}

		if (!block.expectedResultIsInteger && operand.isInteger) {
			throw getError(ErrorCode.EXPECTED_FLOAT_OPERAND, line, context);
		}

		context.stack.push(operand);
	}

	return { byteCode: [WASMInstruction.END], context };
};

export default ifEnd;
