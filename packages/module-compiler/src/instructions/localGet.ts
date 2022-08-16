import { localGet } from '@8f4e/bytecode-utils';
import { AST } from '../types';

export default function (line: AST[number], locals: string[]) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === 'identifier') {
		if (locals.indexOf(line.arguments[0].value) === -1) {
			throw `'1003: Undefined identifier: '${line.arguments[0].value}'`;
		}

		return localGet(locals.indexOf(line.arguments[0].value));
	} else {
		return localGet(line.arguments[0].value);
	}
}
