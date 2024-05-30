import { moduleTester } from './testUtils';

moduleTester(
	'mul (int)',
	`module mul

int input1
int input2 
int output
    
push &output
push input1
push input2
mul
store
    
moduleEnd
`,
	[[{ input1: 2, input2: 2 }, { output: 4 }]],
	[[{ input1: 2, input2: 0 }, { output: 0 }]]
);

moduleTester(
	'mul (float)',
	`module mul

float input1
float input2 
float output
    
push &output
push input1
push input2
mul
store
    
moduleEnd
`,
	[[{ input1: 4.001, input2: 0.5 }, { output: 2 }]]
);
