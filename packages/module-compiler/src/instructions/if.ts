import { Instruction, Type } from '@8f4e/bytecode-utils';

import { AST, ArgumentType } from '../types';

export default function (line: AST[number]) {
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		return [Instruction.IF, Type.VOID];
	}

	return [Instruction.IF, Type.I32];
}
