import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const or: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		// We need to access operand values to track isNonZero for the OR operation
		const operand2 = context.stack.pop()!;
		const operand1 = context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: operand1.isNonZero || operand2.isNonZero });
		return saveByteCode(context, [WASMInstruction.I32_OR]);
	}
);

export default or;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'or',
	`module or

int input1
int input2 
int output
    
push &output
push input1
push input2
or
store
    
moduleEnd
`,
	[
		[{ input1: 1, input2: 0 }, { output: 1 }],
		[{ input1: 0b0011, input2: 0b0110 }, { output: 0b0111 }],
	]
);
}
