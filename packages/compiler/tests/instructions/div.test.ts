import { moduleTester } from './testUtils';

moduleTester(
	'div (int)',
	`module div

int input1
int input2 
int output
    
push &output
push input1
push input2
ensureNonZero
div
store
    
moduleEnd
`,
	[[{ input1: 100, input2: 10 }, { output: 10 }]]
);

moduleTester(
	'div (float)',
	`module div

float input1
float input2 
float output
    
push &output
push input1
push input2
ensureNonZero
div
store
    
moduleEnd
`,
	[[{ input1: 420.001, input2: 69.001 }, { output: 6.0869 }]]
);
