import { moduleTester } from './testUtils';

moduleTester(
	'equalToZero',
	`module equalToZero

int input
int output

push &output
push input
equalToZero
store

moduleEnd
`,
	[
		[{ input: 420 }, { output: 0 }],
		[{ input: -69 }, { output: 0 }],
		[{ input: 0 }, { output: 1 }],
	]
);
