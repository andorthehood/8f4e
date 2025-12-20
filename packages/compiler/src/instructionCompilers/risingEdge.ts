import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const risingEdge: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation with minOperands: 1 guarantees at least 1 operand exists on the stack
		context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: false });

		const currentValueName = '__risingEdgeDetector_currentValue' + line.lineNumber;
		const previousValueName = '__risingEdgeDetector_previousValue' + line.lineNumber;

		return compileSegment(
			[
				`int ${previousValueName} 0`,
				`local int ${currentValueName}`,
				`localSet ${currentValueName}`,
				`localGet ${currentValueName}`,
				`push &${previousValueName}`,
				'load',
				'greaterThan',
				'if int',
				'push 1',
				'else',
				'push 0',
				'ifEnd',
				`push &${previousValueName}`,
				`localGet ${currentValueName}`,
				'store',
			],
			context
		);
	}
);

export default risingEdge;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'risingEdge',
	`module risingEdge

int input 
int output

push &output
 push input
 risingEdge
 if int
  push 1
 else
  push 0
 ifEnd
store

moduleEnd
`,
	[
		[{ input: 12 }, { output: 1 }],
		[{ input: 11 }, { output: 0 }],
		[{ input: 10 }, { output: 0 }],
		[{ input: 12 }, { output: 1 }],
		[{ input: 12 }, { output: 0 }],
		[{ input: 12 }, { output: 0 }],
		[{ input: 13 }, { output: 1 }],
		[{ input: 10 }, { output: 0 }],
	]
);
}
