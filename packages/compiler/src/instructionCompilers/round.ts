import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const round: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		context.stack.push({ isInteger: false, isNonZero: false });

		return saveByteCode(context, [WASMInstruction.F32_NEAREST]);
	}
);

export default round;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'round',
	`module round

float input
float output

push &output
push input
round
store

moduleEnd
`,
	[[{ input: 4.1 }, { output: 4 }]],
	[[{ input: 4.5 }, { output: 4 }]],
	[[{ input: 4.51 }, { output: 5 }]],
	[[{ input: 4.6 }, { output: 5 }]],
	[[{ input: 4.9 }, { output: 5 }]]
);
}
