import { moduleTester } from './testUtils';

moduleTester(
	'branch (int)',
	`module block

int output

branch 1
push &output
push 1
store
    
moduleEnd
`,
	[[{}, { output: 0 }]]
);
