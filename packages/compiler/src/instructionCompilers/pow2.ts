import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const pow2: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: false });

		return compileSegment(['push 2', 'push 1', 'sub', 'swap', 'shiftLeft'], context);
	}
);

export default pow2;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'pow2',
	`module pow2

int input
int output

push &output
push input
pow2
store

moduleEnd
`,
	[[{ input: 2 }, { output: 4 }]],
	[[{ input: 4 }, { output: 16 }]]
);
}
