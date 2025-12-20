import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const hasChanged: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
	},
	(line, context) => {
		const operand = context.stack.pop()!;

		const currentValueName = '__hasChangedDetector_currentValue' + line.lineNumber;
		const previousValueName = '__hasChangedDetector_previousValue' + line.lineNumber;
		const memoryType = operand.isInteger ? 'int' : 'float';

		context.stack.push({ isInteger: operand.isInteger, isNonZero: false });

		return compileSegment(
			[
				`${memoryType} ${previousValueName} 0`,
				`local ${memoryType} ${currentValueName}`,
				`localSet ${currentValueName}`,
				`localGet ${currentValueName}`,
				`push &${previousValueName}`,
				operand.isInteger ? 'load' : 'loadFloat',
				'equal',
				'equalToZero',
				`push &${previousValueName}`,
				`localGet ${currentValueName}`,
				'store',
			],
			context
		);
	}
);

export default hasChanged;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'hasChanged with int',
	`module hasChanged

int input 
int output

push &output
 push input
 hasChanged
 if int
  push 1
 else
  push 0
 ifEnd
store

moduleEnd
`,
	[
		[{ input: 10 }, { output: 1 }],
		[{ input: 10 }, { output: 0 }],
		[{ input: 10 }, { output: 0 }],
		[{ input: 11 }, { output: 1 }],
		[{ input: 11 }, { output: 0 }],
		[{ input: 10 }, { output: 1 }],
		[{ input: 12 }, { output: 1 }],
		[{ input: 12 }, { output: 0 }],
	]
);

moduleTester(
	'hasChanged with float',
	`module hasChanged

float input 
int output

push &output
 push input
 hasChanged
 if int
  push 1
 else
  push 0
 ifEnd
store

moduleEnd
`,
	[
		[{ input: 1.5 }, { output: 1 }],
		[{ input: 1.5 }, { output: 0 }],
		[{ input: 1.5 }, { output: 0 }],
		[{ input: 2.5 }, { output: 1 }],
		[{ input: 2.5 }, { output: 0 }],
		[{ input: 1.5 }, { output: 1 }],
		[{ input: 3.0 }, { output: 1 }],
		[{ input: 3.0 }, { output: 0 }],
	]
);
}
