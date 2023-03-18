import WASMInstruction from '../wasmUtils/wasmInstruction';
import Type from '../wasmUtils/type';
import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const _if: InstructionHandler = function (line, namespace, stack, blockStack) {
	const operand = stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack, blockStack);
	}

	if (!operand.isInteger) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, namespace, stack, blockStack);
	}

	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		blockStack.push({ expectedResultIsInteger: false, hasExpectedResult: false });
		return { byteCode: [WASMInstruction.IF, Type.VOID], namespace, stack, blockStack };
	}

	// TODO: fix parse argument[0] to determine the result type
	blockStack.push({ expectedResultIsInteger: true, hasExpectedResult: true });

	return { byteCode: [WASMInstruction.IF, Type.I32], namespace, stack, blockStack };
};

export default _if;
