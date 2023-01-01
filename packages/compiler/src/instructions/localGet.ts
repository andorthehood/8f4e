import { localGet } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';

const _localGet: InstructionHandler = function (line, { locals }) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		if (locals.indexOf(line.arguments[0].value) === -1) {
			throw `'1003: Undeclared identifier: '${line.arguments[0].value}'`;
		}

		return localGet(locals.indexOf(line.arguments[0].value));
	} else {
		throw `'1005: Expected identifier, got a value: '${line.arguments[0].value}''`;
	}
};

export default _localGet;
