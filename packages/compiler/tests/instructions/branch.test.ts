import { moduleTester } from './testUtils';

moduleTester(
	'branch (int)',
	`module block

int output

block void
branch 1
push &output
push 1
store
blockEnd
    
moduleEnd
`,
	[[{}, { output: 0 }]]
);
