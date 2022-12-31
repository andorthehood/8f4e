import { Instruction, Type } from '@8f4e/bytecode-utils';

import { ArgumentType, InstructionHandler } from '../types';

const block: InstructionHandler = function (line) {
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		return [Instruction.BLOCK, Type.VOID];
	}

	return [Instruction.BLOCK, Type.I32];
};

export default block;
