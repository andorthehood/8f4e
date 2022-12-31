import { Instruction, Type } from '@8f4e/bytecode-utils';

import { ArgumentType, InstructionHandler } from '../types';

const loop: InstructionHandler = function (line) {
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		return [Instruction.LOOP, Type.VOID];
	}

	return [Instruction.LOOP, Type.I32];
};

export default loop;
