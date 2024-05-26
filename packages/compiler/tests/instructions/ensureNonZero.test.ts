import { moduleTester } from './testUtils';

moduleTester(
	'ensureNonZero (int)',
	`module ensureNonZero
int input 
int output
    
push &output
push input
ensureNonZero
store
    
moduleEnd
`,
	[
		[{ input: 69 }, { output: 69 }],
		[{ input: 0 }, { output: 1 }],
		[{ input: -420 }, { output: -420 }],
	]
);

moduleTester(
	'ensureNonZero (float)',
	`module ensureNonZero
float input 
float output
    
push &output
push input
ensureNonZero
store
    
moduleEnd
`,
	[
		[{ input: 69.1 }, { output: 69.1 }],
		[{ input: 0 }, { output: 1.0001 }],
		[{ input: -420.1 }, { output: -420.1 }],
	]
);
