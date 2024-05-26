import { moduleTester } from './testUtils';

moduleTester(
	'castToFloat',
	`module castToFloat

int input
float output

push &output
push input
castToFloat
store

moduleEnd
`,
	[
		[{ input: 1 }, { output: 1.0001 }],
		[{ input: -69 }, { output: -69.0001 }],
		[{ input: 0 }, { output: 0.0001 }],
		[{ input: 420 }, { output: 420.0001 }],
	]
);
