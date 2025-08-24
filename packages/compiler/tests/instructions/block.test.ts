import { moduleTester } from './testUtils';

moduleTester(
	'block (int)',
	`module block
int input 
int output
    

push &output
block int
 push input
blockEnd
store
    
moduleEnd
`,
	[
		[{ input: 69 }, { output: 69 }],
		[{ input: 1 }, { output: 1 }],
		[{ input: -420 }, { output: -420 }],
	]
);

moduleTester(
	'block (float)',
	`module block
float input 
float output
    

push &output
block float
 push input
blockEnd
store
    
moduleEnd
`,
	[
		[{ input: 69.1 }, { output: 69.1 }],
		[{ input: 1.1 }, { output: 1.1 }],
		[{ input: -420.1 }, { output: -420.1 }],
	]
);
