import { i32const, i32load, localGet } from '@8f4e/bytecode-utils';
import { AST, MemoryMap } from '../types';
import { getMemoryItemByteAddress, isInputPointer, isLocalIdentifier, isMemoryIdentifier } from '../utils';

export default function push(line: AST[number], locals: string[], memory: MemoryMap) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	const argument = line.arguments[0];

	if (argument.type === 'identifier') {
		if (isMemoryIdentifier(memory, argument.value)) {
			return [
				...i32const(getMemoryItemByteAddress(memory, argument.value)),
				...(isInputPointer(memory, argument.value) ? i32load() : []),
				...i32load(),
			];
		} else if (isLocalIdentifier(locals, argument.value)) {
			return localGet(locals.indexOf(argument.value));
		}
	}

	if (argument.type === 'literal') {
		return i32const(argument.value);
	}
}
