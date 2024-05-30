import { moduleTester } from './testUtils';

moduleTester(
	'pow2',
	`module pow2

int input
int output

push &output
push input
pow2
store

moduleEnd
`,
	[[{ input: 2 }, { output: 4 }]],
	[[{ input: 4 }, { output: 16 }]]
);
