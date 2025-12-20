import { areAllOperandsIntegers, saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const greaterOrEqual: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'matching',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand2 = context.stack.pop()!;
		const operand1 = context.stack.pop()!;

		if (areAllOperandsIntegers(operand1, operand2)) {
			context.stack.push({ isInteger: true, isNonZero: false });
			return saveByteCode(context, [WASMInstruction.I32_GE_S]);
		} else {
			context.stack.push({ isInteger: true, isNonZero: false });
			return saveByteCode(context, [WASMInstruction.F32_GE]);
		}
	}
);

export default greaterOrEqual;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'greaterOrEqual (int)',
	`module greaterOrEqual

int input1
int input2
int output

push &output
push input1
push input2
greaterOrEqual
store

moduleEnd
`,
	[[{ input1: 420, input2: 420 }, { output: 1 }]],
	[[{ input1: 420, input2: 0 }, { output: 1 }]],
	[[{ input1: 0, input2: 0 }, { output: 1 }]],
	[[{ input1: 0, input2: 69 }, { output: 0 }]],
	[[{ input1: 0, input2: -69 }, { output: 1 }]]
);

moduleTester(
	'greaterOrEqual (float)',
	`module greaterOrEqual

float input1
float input2
int output

push &output
push input1
push input2
greaterOrEqual
store

moduleEnd
`,
	[[{ input1: 420.1, input2: 420.1 }, { output: 1 }]],
	[[{ input1: 420.1, input2: 0.001 }, { output: 1 }]],
	[[{ input1: 0.001, input2: 0.001 }, { output: 1 }]],
	[[{ input1: 0.001, input2: 69.1 }, { output: 0 }]],
	[[{ input1: 0.001, input2: -69.1 }, { output: 1 }]]
);
}
