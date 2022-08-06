import { i32const } from '@8f4e/bytecode-utils';
import { AST } from '../types';
import { WORD_LENGTH } from '../consts';

export default function (line: AST[number], locals = [], memory: string[], startingByteAddress: number) {
	if (line.arguments[0].type === 'identifier') {
		return i32const(startingByteAddress + memory.indexOf(line.arguments[0].value) * WORD_LENGTH);
	} else {
		return i32const(line.arguments[0].value);
	}
}
