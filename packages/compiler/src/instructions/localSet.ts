import { localSet } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';

const _localSet: InstructionHandler = function (line, namespace) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		if (namespace.locals.indexOf(line.arguments[0].value) === -1) {
			throw `'1003: Undeclared identifier: '${line.arguments[0].value}''`;
		}

		return { byteCode: localSet(namespace.locals.indexOf(line.arguments[0].value)), namespace };
	} else {
		throw `'1005: Expected identifier, got a value: '${line.arguments[0].value}''`;
	}
};

export default _localSet;
