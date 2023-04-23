import WASMInstruction from '../wasmUtils/wasmInstruction';
import Type from '../wasmUtils/type';
import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const loop: InstructionHandler = function (line, context) {
	if (context.blockStack.length < 1) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		return { byteCode: [WASMInstruction.LOOP, Type.VOID], context };
	}

	return { byteCode: [WASMInstruction.LOOP, Type.I32], context };
};

export default loop;
