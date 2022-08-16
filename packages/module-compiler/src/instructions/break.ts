import { br } from '@8f4e/bytecode-utils';
import { AST } from '../types';

export default function (line: AST[number]) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === 'identifier') {
		throw `'1004: Expected value, got an identifier: '${line.arguments[0].value}''`;
	} else {
		return br(line.arguments[0].value);
	}
}
