import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const _else: InstructionHandler = function (line, namespace, stack, blockStack) {
	const block = blockStack.pop();

	if (!block) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, namespace, stack, blockStack);
	}

	if (block.hasExpectedResult) {
		const operand = stack.pop();

		if (!operand) {
			throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack, blockStack);
		}

		if (block.expectedResultIsInteger && !operand.isInteger) {
			throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, namespace, stack, blockStack);
		}
	}

	blockStack.push(block);

	return { byteCode: [WASMInstruction.ELSE], namespace, stack, blockStack };
};

export default _else;
