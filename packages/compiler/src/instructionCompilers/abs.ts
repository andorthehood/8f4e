import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const abs: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		if (operand.isInteger) {
			context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });
			const valueName = '__absify_value' + line.lineNumber;

			return compileSegment(
				[
					`local int ${valueName}`,
					`localSet ${valueName}`,
					`localGet ${valueName}`,
					'push 0',
					'lessThan',
					'if',
					' push 0',
					` localGet ${valueName}`,
					' sub',
					'else',
					` localGet ${valueName}`,
					'ifEnd',
				],
				context
			);
		} else {
			context.stack.push({ isInteger: false, isNonZero: operand.isNonZero });
			return saveByteCode(context, [WASMInstruction.F32_ABS]);
		}
	}
);

export default abs;



if (import.meta.vitest) {
	const { moduleTester } = await import('../../tests/instructions/testUtils');

moduleTester(
	'abs (int)',
	`module abs

int input 
int output
    
push &output
push input
abs
store
    
moduleEnd
`,
	[
		[{ input: 1 }, { output: 1 }],
		[{ input: -1 }, { output: 1 }],
		[{ input: -69 }, { output: 69 }],
		[{ input: 420 }, { output: 420 }],
	]
);

moduleTester(
	'abs (float)',
	`module abs

float input 
float output
    
push &output
push input
abs
store
    
moduleEnd
`,
	[
		[{ input: 1.1 }, { output: 1.1 }],
		[{ input: -1.1 }, { output: 1.1 }],
		[{ input: -69.1 }, { output: 69.1 }],
		[{ input: 420.1 }, { output: 420.1 }],
	]
);
}
