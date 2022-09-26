import { localSet } from '@8f4e/bytecode-utils';

import { AST, ArgumentType } from '../types';

export default function (line: AST[number], locals: string[]) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		if (locals.indexOf(line.arguments[0].value) === -1) {
			throw `'1003: Unidentified identifier: '${line.arguments[0].value}''`;
		}

		return localSet(locals.indexOf(line.arguments[0].value));
	} else {
		return localSet(line.arguments[0].value);
	}
}
