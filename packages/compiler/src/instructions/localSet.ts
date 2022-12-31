import { localSet } from '@8f4e/bytecode-utils';

import { ArgumentType, InstructionHandler } from '../types';

const _localSet: InstructionHandler = function (line, locals) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		if (locals.indexOf(line.arguments[0].value) === -1) {
			throw `'1003: Undeclared identifier: '${line.arguments[0].value}''`;
		}

		return localSet(locals.indexOf(line.arguments[0].value));
	} else {
		throw `'1005: Expected identifier, got a value: '${line.arguments[0].value}''`;
	}
};

export default _localSet;
