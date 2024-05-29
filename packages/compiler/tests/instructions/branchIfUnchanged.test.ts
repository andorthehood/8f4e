import { moduleTester } from './testUtils';

moduleTester(
	'branchIfUnchanged',
	`module branchIfUnchanged
    
int input 
int output
	
push &output
push 0
store

block void
 push input
 branchIfUnchanged 1 ; Return before the output is set to 1
 push &output
  push 1
 store
blockEnd
	
moduleEnd
`,
	[
		[{ input: 0 }, { output: 0 }],
		[{ input: 0 }, { output: 0 }],
		[{ input: 1 }, { output: 1 }],
		[{ input: 1 }, { output: 0 }],
		[{ input: 1 }, { output: 0 }],
	]
);
