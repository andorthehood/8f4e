import { i32const, i32load, localGet } from '@8f4e/bytecode-utils';

import { AST, ArgumentType, MemoryMap } from '../types';
import {
	getMemoryItemByteAddress,
	isInputPointer,
	isLocalIdentifier,
	isMemoryIdentifier,
	isMemoryReferenceIdentifier,
} from '../utils';

export default function push(line: AST[number], locals: string[], memory: MemoryMap) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	const argument = line.arguments[0];

	if (argument.type === ArgumentType.IDENTIFIER) {
		if (isMemoryIdentifier(memory, argument.value)) {
			return [
				...i32const(getMemoryItemByteAddress(memory, argument.value)),
				...(isInputPointer(memory, argument.value) ? i32load() : []),
				...i32load(),
			];
		} else if (isMemoryReferenceIdentifier(memory, argument.value)) {
			return i32const(getMemoryItemByteAddress(memory, argument.value.substring(1)));
		} else if (isLocalIdentifier(locals, argument.value)) {
			return localGet(locals.indexOf(argument.value));
		}
	}

	if (argument.type === ArgumentType.LITERAL) {
		return i32const(argument.value);
	}
}
