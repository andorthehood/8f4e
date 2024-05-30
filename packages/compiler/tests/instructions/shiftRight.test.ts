import { moduleTester } from './testUtils';

moduleTester(
	'shiftRight',
	`module shiftRight

int input1
int input2
int output

push &output
push input1
push input2
shiftRight
store

moduleEnd
`,
	[[{ input1: 0b0001, input2: 1 }, { output: 0b0000 }]],
	[[{ input1: 0b1000, input2: 2 }, { output: 0b0010 }]],
	[[{ input1: 0b1100, input2: 3 }, { output: 0b0001 }]]
);
