import { moduleTester } from './testUtils';

moduleTester(
	'const',
	`module const

const TEST1 420
const TEST2 420.69
const TEST3 69

int output1
float output2
int output3 TEST3

push &output1
push TEST1
store

push &output2
push TEST2
store

moduleEnd
`,
	[[{}, { output1: 420, output2: 420.69, output3: 69 }]]
);
