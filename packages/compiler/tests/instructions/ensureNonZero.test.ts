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
