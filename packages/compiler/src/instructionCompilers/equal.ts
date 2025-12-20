import { areAllOperandsIntegers, saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const equal: InstructionCompiler = withValidation(
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
		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [isInteger ? WASMInstruction.I32_EQ : WASMInstruction.F32_EQ]);
	}
);

export default equal;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'equal',
	`module equal

int input1
int input2
int output

push &output
push input1
push input2
equal
store

moduleEnd
`,
	[
		[{ input1: 420, input2: 420 }, { output: 1 }],
		[{ input1: 420, input2: -420 }, { output: 0 }],
		[{ input1: 69, input2: 96 }, { output: 0 }],
		[{ input1: 0, input2: 0 }, { output: 1 }],
	]
);
}
