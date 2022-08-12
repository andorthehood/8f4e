import { i32const, i32load } from '@8f4e/bytecode-utils';
import { WORD_LENGTH } from '../consts';
import { AST } from '../types';

export default function load(line: AST[number], locals: string[], memory: string[], startingByteAddress: number) {
	if (!line.arguments[0]) {
		return i32load();
	}

	if (line.arguments[0].type === 'identifier') {
		if (memory.indexOf(line.arguments[0].value) === -1) {
			throw `'1003: Unidentified identifier: '${line.arguments[0].value}''`;
		}

		return [...i32const(startingByteAddress + memory.indexOf(line.arguments[0].value) * WORD_LENGTH), ...i32load()];
	}
}
