import { moduleTester } from './testUtils';

moduleTester(
	'equal',
	`module equal

int input1
int input2
int output

push &output
push input1
push input2
equal
store

moduleEnd
`,
	[
		[{ input1: 420, input2: 420 }, { output: 1 }],
		[{ input1: 420, input2: -420 }, { output: 0 }],
		[{ input1: 69, input2: 96 }, { output: 0 }],
		[{ input1: 0, input2: 0 }, { output: 1 }],
	]
);
