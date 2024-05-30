import { moduleTester } from './testUtils';

moduleTester(
	'or',
	`module or

int input1
int input2 
int output
    
push &output
push input1
push input2
or
store
    
moduleEnd
`,
	[
		[{ input1: 1, input2: 0 }, { output: 1 }],
		[{ input1: 0b0011, input2: 0b0110 }, { output: 0b0111 }],
	]
);
