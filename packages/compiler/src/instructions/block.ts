import WASMInstruction from '../wasmUtils/wasmInstruction';
import Type from '../wasmUtils/type';
import { ArgumentType, InstructionHandler } from '../types';

const block: InstructionHandler = function (line, namespace, stack) {
	let type = Type.I32;

	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		type = Type.VOID;
	}

	return { byteCode: [WASMInstruction.BLOCK, type], namespace, stack };
};

export default block;
