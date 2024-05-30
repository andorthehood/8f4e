import { moduleTester } from './testUtils';

moduleTester(
	'shiftLeft',
	`module shiftLeft

int input1
int input2
int output

push &output
push input1
push input2
shiftLeft
store

moduleEnd
`,
	[[{ input1: 0b0001, input2: 1 }, { output: 0b0010 }]],
	[[{ input1: 0b0001, input2: 2 }, { output: 0b0100 }]],
	[[{ input1: 0b0011, input2: 3 }, { output: 0b11000 }]]
);
