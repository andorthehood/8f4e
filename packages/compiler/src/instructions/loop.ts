import WASMInstruction from '../wasmUtils/wasmInstruction';
import Type from '../wasmUtils/type';
import { ArgumentType, InstructionHandler } from '../types';

const loop: InstructionHandler = function (line, namespace, stack, blockStack) {
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		return { byteCode: [WASMInstruction.LOOP, Type.VOID], namespace, stack, blockStack };
	}

	return { byteCode: [WASMInstruction.LOOP, Type.I32], namespace, stack, blockStack };
};

export default loop;
