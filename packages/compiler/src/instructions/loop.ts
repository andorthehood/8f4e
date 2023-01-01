import WASMInstruction from '../wasmUtils/wasmInstruction';
import Type from '../wasmUtils/type';
import { ArgumentType, InstructionHandler } from '../types';

const loop: InstructionHandler = function (line) {
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		return [WASMInstruction.LOOP, Type.VOID];
	}

	return [WASMInstruction.LOOP, Type.I32];
};

export default loop;
