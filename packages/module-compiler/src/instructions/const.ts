import { i32const } from '@8f4e/bytecode-utils';
import { ArgumentType, AST, MemoryMap } from '../types';
import { getMemoryItemByteAddress, isMemoryIdentifier } from '../utils';

export default function (line: AST[number], locals, memory: MemoryMap) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		if (!isMemoryIdentifier(memory, line.arguments[0].value)) {
			throw `'1003: Unidentified identifier: '${line.arguments[0].value}'`;
		}

		return i32const(getMemoryItemByteAddress(memory, line.arguments[0].value));
	} else {
		return i32const(line.arguments[0].value);
	}
}
