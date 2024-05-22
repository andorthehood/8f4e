import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { isInstructionIsInsideAModule } from '../utils';

const _if: InstructionHandler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (!operand.isInteger) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, context);
	}

	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			isModuleBlock: false,
			isGroupBlock: false,
			isLoop: false,
			isConditionBlock: true,
		});
		return { byteCode: [WASMInstruction.IF, Type.VOID], context };
	}

	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'float') {
		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: true,
			isModuleBlock: false,
			isGroupBlock: false,
			isLoop: false,
			isConditionBlock: true,
		});
		return { byteCode: [WASMInstruction.IF, Type.F32], context };
	}

	context.blockStack.push({
		expectedResultIsInteger: true,
		hasExpectedResult: true,
		isModuleBlock: false,
		isGroupBlock: false,
		isLoop: false,
		isConditionBlock: true,
	});
	return { byteCode: [WASMInstruction.IF, Type.I32], context };
};

export default _if;
