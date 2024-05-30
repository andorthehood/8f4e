import { moduleTester } from './testUtils';

moduleTester(
	'sqrt',
	`module sqrt

float input
float output

push &output
push input
sqrt
store

moduleEnd
`,
	[[{ input: 4.001 }, { output: 2 }]],
	[[{ input: 16.001 }, { output: 4 }]]
);
