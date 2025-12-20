import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const shiftLeft: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		context.stack.pop()!;
		context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [WASMInstruction.I32_SHL]);
	}
);

export default shiftLeft;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'shiftLeft',
	`module shiftLeft

int input1
int input2
int output

push &output
push input1
push input2
shiftLeft
store

moduleEnd
`,
	[[{ input1: 0b0001, input2: 1 }, { output: 0b0010 }]],
	[[{ input1: 0b0001, input2: 2 }, { output: 0b0100 }]],
	[[{ input1: 0b0011, input2: 3 }, { output: 0b11000 }]]
);
}
