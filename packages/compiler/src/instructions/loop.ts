import { Instruction, Type } from '@8f4e/bytecode-utils';

import { AST, ArgumentType } from '../types';

export default function loop(line: AST[number]) {
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		return [Instruction.LOOP, Type.VOID];
	}

	return [Instruction.LOOP, Type.I32];
}
