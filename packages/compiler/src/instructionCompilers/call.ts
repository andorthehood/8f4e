import { ErrorCode, getError } from '../errors';
import { ArgumentType } from '../types';
import { saveByteCode } from '../utils';
import { call as wasmCall } from '../wasmUtils/instructionHelpers';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const call: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line, context) => {
		const functionNameArg = line.arguments[0];
		if (!functionNameArg || functionNameArg.type !== ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		const functionName = functionNameArg.value;
		const targetFunction = context.namespace.functions?.[functionName];

		if (!targetFunction) {
			throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context);
		}

		// Validate stack has the right arguments
		const { parameters, returns } = targetFunction.signature;
		if (context.stack.length < parameters.length) {
			throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
		}

		// Check parameter types match
		for (let i = 0; i < parameters.length; i++) {
			const stackIndex = context.stack.length - parameters.length + i;
			const stackItem = context.stack[stackIndex];
			const expectedInteger = parameters[i] === 'int';
			if (stackItem.isInteger !== expectedInteger) {
				throw getError(ErrorCode.TYPE_MISMATCH, line, context);
			}
		}

		// Pop arguments from stack
		context.stack.splice(context.stack.length - parameters.length, parameters.length);

		// Push return values onto stack
		returns.forEach(returnType => {
			context.stack.push({ isInteger: returnType === 'int' });
		});

		// Emit WASM call instruction
		if (targetFunction.wasmIndex !== undefined) {
			saveByteCode(context, wasmCall(targetFunction.wasmIndex));
		}

		return context;
	}
);

export default call;



if (import.meta.vitest) {
	const { moduleTesterWithFunctions } = await import('./testUtils');

moduleTesterWithFunctions(
	'call constant function',
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
	'call function with parameter',
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
	'call function multiple times',
	`module test
int output

loop
  push &output
  call getTwo
  call getThree
  add
  store
loopEnd

moduleEnd`,
	[
		`function getTwo
push 2
functionEnd int`,
		`function getThree
push 3
functionEnd int`,
	],
	[[{}, { output: 5 }]]
);
}
