import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const sqrt: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		context.stack.push({ isInteger: false, isNonZero: true });
		return saveByteCode(context, [WASMInstruction.F32_SQRT]);
	}
);

export default sqrt;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'sqrt',
	`module sqrt

float input
float output

push &output
push input
sqrt
store

moduleEnd
`,
	[[{ input: 4.001 }, { output: 2 }]],
	[[{ input: 16.001 }, { output: 4 }]]
);
}
