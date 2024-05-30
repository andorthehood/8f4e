import { moduleTester } from './testUtils';

moduleTester(
	'swap (int)',
	`module swap

int input
int output

push input
push &output
swap
store
    
moduleEnd
`,
	[[{ input: 69 }, { output: 69 }]]
);
