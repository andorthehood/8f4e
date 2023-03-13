import WASMInstruction from '../wasmUtils/wasmInstruction';
import Type from '../wasmUtils/type';
import { ArgumentType, InstructionHandler } from '../types';

const _if: InstructionHandler = function (line, namespace, stack) {
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		return { byteCode: [WASMInstruction.IF, Type.VOID], namespace, stack };
	}

	return { byteCode: [WASMInstruction.IF, Type.I32], namespace, stack };
};

export default _if;
