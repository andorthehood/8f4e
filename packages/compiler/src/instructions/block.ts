import WASMInstruction from '../wasmUtils/wasmInstruction';
import Type from '../wasmUtils/type';
import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { isInstructionIsInsideAModule } from '../utils';

const block: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			isModuleBlock: false,
			isGroupBlock: false,
		});
		return { byteCode: [WASMInstruction.BLOCK, Type.VOID], context };
	}

	// TODO: fix parse argument[0] to determine the result type
	context.blockStack.push({
		expectedResultIsInteger: true,
		hasExpectedResult: true,
		isModuleBlock: false,
		isGroupBlock: false,
	});
	return { byteCode: [WASMInstruction.BLOCK, Type.I32], context };
};

export default block;
