import { moduleTester } from './testUtils';

moduleTester(
	'castToInt',
	`module castToInt

float input
int output

push &output
push input
castToInt
store

moduleEnd
`,
	[
		[{ input: 1.1 }, { output: 1 }],
		[{ input: -69.69 }, { output: -69 }],
		[{ input: 0.001 }, { output: 0 }],
		[{ input: 420.99 }, { output: 420 }],
	]
);
