import { localGet } from 'bytecode-utils';
import { AST } from '../types';

export default function (line: AST[number], locals: string[]) {
	if (line.arguments[0].type === 'identifier') {
		return localGet(locals.indexOf(line.arguments[0].value));
	} else {
		return localGet(line.arguments[0].value);
	}
}
