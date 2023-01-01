import Instruction from '../bytecodeUtils/instruction';
import Type from '../bytecodeUtils/type';
import { ArgumentType } from '../types';

const _if = function (line) {
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		return [Instruction.IF, Type.VOID];
	}

	return [Instruction.IF, Type.I32];
};

export default _if;
