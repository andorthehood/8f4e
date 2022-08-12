import { i32const } from '@8f4e/bytecode-utils';
import { AST } from '../types';
import { WORD_LENGTH } from '../consts';

export default function (line: AST[number], locals = [], memory: string[], startingByteAddress: number) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === 'identifier') {
		if (memory.indexOf(line.arguments[0].value) === -1) {
			throw `'1003: Unidentified identifier: '${line.arguments[0].value}''`;
		}

		return i32const(startingByteAddress + memory.indexOf(line.arguments[0].value) * WORD_LENGTH);
	} else {
		return i32const(line.arguments[0].value);
	}
}
