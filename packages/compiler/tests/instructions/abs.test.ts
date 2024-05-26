import { moduleTester } from './testUtils';

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
