import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const and: InstructionCompiler = withValidation(
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
		return saveByteCode(context, [WASMInstruction.I32_AND]);
	}
);

export default and;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'and',
	`module and

int input1
int input2 
int output
    
push &output
push input1
push input2
and
store
    
moduleEnd
`,
	[
		[{ input1: 1, input2: 0 }, { output: 0 }],
		[{ input1: 0b0011, input2: 0b0110 }, { output: 0b0010 }],
	]
);
}
