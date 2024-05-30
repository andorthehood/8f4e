import { moduleTester } from './testUtils';

moduleTester(
	'round',
	`module round

float input
float output

push &output
push input
round
store

moduleEnd
`,
	[[{ input: 4.1 }, { output: 4 }]],
	[[{ input: 4.5 }, { output: 4 }]],
	[[{ input: 4.51 }, { output: 5 }]],
	[[{ input: 4.6 }, { output: 5 }]],
	[[{ input: 4.9 }, { output: 5 }]]
);
