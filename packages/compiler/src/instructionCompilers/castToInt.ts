import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const castToInt: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });

		return saveByteCode(context, [WASMInstruction.I32_TUNC_F32_S]);
	}
);

export default castToInt;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'castToInt',
	`module castToInt

float input
int output

push &output
push input
castToInt
store

moduleEnd
`,
	[
		[{ input: 1.1 }, { output: 1 }],
		[{ input: -69.69 }, { output: -69 }],
		[{ input: 0.001 }, { output: 0 }],
		[{ input: 420.99 }, { output: 420 }],
	]
);
}
