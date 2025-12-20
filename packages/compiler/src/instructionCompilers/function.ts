import { ErrorCode, getError } from '../errors';
import { isInstructionIsInsideAModule, isInstructionInsideFunction } from '../utils';
import { BLOCK_TYPE, ArgumentType } from '../types';

import type { InstructionCompiler } from '../types';

// Note: This instruction does not use withValidation because it requires inverted scope validation:
// it must NOT be inside a module or function, which is the opposite of the standard scope rules
// that withValidation supports. The withValidation helper is designed for positive scope assertions
// (must be inside X), not negative ones (must NOT be inside X).
const _function: InstructionCompiler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack) || isInstructionInsideFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	// Parse function name: function <name>
	const nameArg = line.arguments[0];
	if (!nameArg || nameArg.type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.MISSING_FUNCTION_ID, line, context);
	}

	const functionId = nameArg.value;

	context.currentFunctionId = functionId;
	context.currentFunctionSignature = {
		parameters: [],
		returns: [],
	};
	context.mode = 'function';

	// Initialize empty locals - parameters will be added by param instructions
	context.namespace.locals = {};

	context.blockStack.push({
		blockType: BLOCK_TYPE.FUNCTION,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	});

	return context;
};

export default _function;



if (import.meta.vitest) {
	const { moduleTesterWithFunctions } = await import('./testUtils');

moduleTesterWithFunctions(
	'function returns constant',
	`module test
int output

loop
  push &output
  call getFortyTwo
  store
loopEnd

moduleEnd`,
	[
		`function getFortyTwo
push 42
functionEnd int`,
	],
	[[{}, { output: 42 }]]
);

moduleTesterWithFunctions(
	'function with parameter',
	`module test
int input
int output

loop
  push &output
  push input
  call double
  store
loopEnd

moduleEnd`,
	[
		`function double
param int x
localGet x
push 2
mul
functionEnd int`,
	],
	[
		[{ input: 5 }, { output: 10 }],
		[{ input: 10 }, { output: 20 }],
	]
);

moduleTesterWithFunctions(
	'function with two parameters',
	`module test
int input1
int input2
int output

loop
  push &output
  push input1
  push input2
  call add
  store
loopEnd

moduleEnd`,
	[
		`function add
param int x
param int y
localGet x
localGet y
add
functionEnd int`,
	],
	[
		[{ input1: 3, input2: 4 }, { output: 7 }],
		[{ input1: -5, input2: 10 }, { output: 5 }],
	]
);
}
