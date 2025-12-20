import { areAllOperandsIntegers, saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const mul: InstructionCompiler = withValidation(
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
		return saveByteCode(context, [isInteger ? WASMInstruction.I32_MUL : WASMInstruction.F32_MUL]);
	}
);

export default mul;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'mul (int)',
	`module mul

int input1
int input2 
int output
    
push &output
push input1
push input2
mul
store
    
moduleEnd
`,
	[[{ input1: 2, input2: 2 }, { output: 4 }]],
	[[{ input1: 2, input2: 0 }, { output: 0 }]]
);

moduleTester(
	'mul (float)',
	`module mul

float input1
float input2 
float output
    
push &output
push input1
push input2
mul
store
    
moduleEnd
`,
	[[{ input1: 4.001, input2: 0.5 }, { output: 2 }]]
);
}
