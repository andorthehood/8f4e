import WASMInstruction from '../wasmUtils/wasmInstruction';
import Type from '../wasmUtils/type';
import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const _if: InstructionHandler = function (line, context) {
	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (!operand.isInteger) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, context);
	}

	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		context.blockStack.push({ expectedResultIsInteger: false, hasExpectedResult: false });
		return { byteCode: [WASMInstruction.IF, Type.VOID], context };
	}

	// TODO: fix parse argument[0] to determine the result type
	context.blockStack.push({ expectedResultIsInteger: true, hasExpectedResult: true });

	return { byteCode: [WASMInstruction.IF, Type.I32], context };
};

export default _if;
