import { moduleTester } from './testUtils';

moduleTester(
	'remainder',
	`module remainder

int input1
int input2
int output

push &output
push input1
push input2
remainder
store

moduleEnd
`,
	[[{ input1: 4, input2: 2 }, { output: 0 }]],
	[[{ input1: 3, input2: 2 }, { output: 1 }]]
);
