import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const castToFloat: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push({ isInteger: false, isNonZero: operand.isNonZero });

		return saveByteCode(context, [WASMInstruction.F32_CONVERT_I32_S]);
	}
);

export default castToFloat;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'castToFloat',
	`module castToFloat

int input
float output

push &output
push input
castToFloat
store

moduleEnd
`,
	[
		[{ input: 1 }, { output: 1.0001 }],
		[{ input: -69 }, { output: -69.0001 }],
		[{ input: 0 }, { output: 0.0001 }],
		[{ input: 420 }, { output: 420.0001 }],
	]
);
}
