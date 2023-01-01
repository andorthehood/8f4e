import WASMInstruction from '../wasmUtils/wasmInstruction';
import Type from '../wasmUtils/type';
import { ArgumentType, InstructionHandler } from '../types';

const block: InstructionHandler = function (line) {
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		return [WASMInstruction.BLOCK, Type.VOID];
	}

	return [WASMInstruction.BLOCK, Type.I32];
};

export default block;
