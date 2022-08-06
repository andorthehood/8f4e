import { localSet } from '@8f4e/bytecode-utils';
import { AST } from '../types';

export default function (line: AST[number], locals: string[]) {
	if (line.arguments[0].type === 'identifier') {
		return localSet(locals.indexOf(line.arguments[0].value));
	} else {
		return localSet(line.arguments[0].value);
	}
}
