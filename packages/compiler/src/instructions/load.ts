import { f32load, i32const, i32load } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import { areAllOperandsIntegers, getMemoryItem } from '../utils';
import { ErrorCode, getError } from '../errors';

// TODO: remove or refactor this instruction
const load: InstructionHandler = function (line, namespace, stack) {
	if (!line.arguments[0]) {
		const operand = stack.pop();

		if (!operand) {
			throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line);
		}

		if (areAllOperandsIntegers(operand)) {
			stack.push({ isInteger: true });
			return { byteCode: i32load(), namespace, stack };
		} else {
			throw getError(ErrorCode.ONLY_INTEGERS, line);
		}
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		const memoryItem = getMemoryItem(namespace.memory, line.arguments[0].value);

		if (!memoryItem) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
		}

		if (memoryItem.isInteger) {
			stack.push({ isInteger: true });
			return {
				byteCode: [...i32const(memoryItem.byteAddress), ...i32load()],
				namespace,
				stack,
			};
		} else {
			stack.push({ isInteger: false });
			return {
				byteCode: [...i32const(memoryItem.byteAddress), ...f32load()],
				namespace,
				stack,
			};
		}
	} else {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line);
	}
};

export default load;
