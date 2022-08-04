import { i32const } from 'bytecode-utils';
import { AST, WORD_LENGTH } from '../moduleCompiler';

export default function (line: AST[number], locals = [], memory: string[]) {
	if (line.arguments[0].type === 'identifier') {
		return i32const(memory.indexOf(line.arguments[0].value) * WORD_LENGTH);
	} else {
		return i32const(line.arguments[0].value);
	}
}
