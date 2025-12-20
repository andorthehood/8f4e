import { areAllOperandsIntegers, saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const greaterThan: InstructionCompiler = withValidation(
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
		return saveByteCode(context, [isInteger ? WASMInstruction.I32_GT_S : WASMInstruction.F32_GT]);
	}
);

export default greaterThan;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'greaterThan (int)',
	`module greaterThan

int input1
int input2
int output

push &output
push input1
push input2
greaterThan
store

moduleEnd
`,
	[[{ input1: 420, input2: 420 }, { output: 0 }]],
	[[{ input1: 420, input2: 0 }, { output: 1 }]],
	[[{ input1: 0, input2: 0 }, { output: 0 }]],
	[[{ input1: 0, input2: 69 }, { output: 0 }]],
	[[{ input1: 0, input2: -69 }, { output: 1 }]]
);

moduleTester(
	'greaterThan (float)',
	`module greaterThan

float input1
float input2
int output

push &output
push input1
push input2
greaterThan
store

moduleEnd
`,
	[[{ input1: 420.1, input2: 420.1 }, { output: 0 }]],
	[[{ input1: 420.1, input2: 0.001 }, { output: 1 }]],
	[[{ input1: 0.001, input2: 0.001 }, { output: 0 }]],
	[[{ input1: 0.001, input2: 69.1 }, { output: 0 }]],
	[[{ input1: 0.001, input2: -69.1 }, { output: 1 }]]
);
}
