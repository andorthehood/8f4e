import { areAllOperandsIntegers, saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const sub: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'matching',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand2 = context.stack.pop()!;
		const operand1 = context.stack.pop()!;

		const isInteger = areAllOperandsIntegers(operand1, operand2);
		context.stack.push({ isInteger, isNonZero: false });
		return saveByteCode(context, [isInteger ? WASMInstruction.I32_SUB : WASMInstruction.F32_SUB]);
	}
);

export default sub;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'sub (int)',
	`module sub

int input1
int input2 
int output
    
push &output
push input1
push input2
sub
store
    
moduleEnd
`,
	[
		[{ input1: 2, input2: 2 }, { output: 0 }],
		[{ input1: -1, input2: 1 }, { output: -2 }],
		[{ input1: -69, input2: 0 }, { output: -69 }],
		[{ input1: 420, input2: 0 }, { output: 420 }],
	]
);
}
