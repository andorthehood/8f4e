import WASMInstruction from '../wasmUtils/wasmInstruction';
import Type from '../wasmUtils/type';
import { ArgumentType } from '../types';

const _if = function (line) {
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		return [WASMInstruction.IF, Type.VOID];
	}

	return [WASMInstruction.IF, Type.I32];
};

export default _if;
