import { i32const, i32load } from '@8f4e/bytecode-utils';

import { AST, ArgumentType, MemoryMap } from '../types';
import { getMemoryItemByteAddress, isInputPointer, isMemoryIdentifier } from '../utils';

export default function load(line: AST[number], locals: string[], memory: MemoryMap) {
	if (!line.arguments[0]) {
		return i32load();
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		if (!isMemoryIdentifier(memory, line.arguments[0].value)) {
			throw `'1003: Undeclared identifier: '${line.arguments[0].value}'`;
		}

		return [
			...i32const(getMemoryItemByteAddress(memory, line.arguments[0].value)),
			...(isInputPointer(memory, line.arguments[0].value) ? i32load() : []),
			...i32load(),
		];
	} else {
		throw `'1005: Expected identifier, got a value: '${line.arguments[0].value}''`;
	}
}
