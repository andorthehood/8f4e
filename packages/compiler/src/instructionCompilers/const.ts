import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';

import type { InstructionCompiler } from '../types';

const _const: InstructionCompiler = function (line, context) {
	// Constants can be declared at any level (top-level, in modules, or in functions)

	if (!line.arguments[0] || !line.arguments[1]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	let value = { value: 0, isInteger: true };

	if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
		if (typeof context.namespace.consts[line.arguments[1].value] !== 'undefined') {
			value = context.namespace.consts[line.arguments[1].value];
		} else {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
		}
	} else {
		value = line.arguments[1];
	}

	context.namespace.consts[line.arguments[0].value] = value;

	return context;
};

export default _const;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'const',
	`module const

const TEST1 420
const TEST2 420.69
const TEST3 69

int output1
float output2
int output3 TEST3

push &output1
push TEST1
store

push &output2
push TEST2
store

moduleEnd
`,
	[[{}, { output1: 420, output2: 420.69, output3: 69 }]]
);
}
