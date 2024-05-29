import { moduleTester } from './testUtils';

moduleTester(
	'loadFloat',
	`module loadFloat
float input 
float output

push &output
 push &input
 loadFloat
store

moduleEnd
`,
	[[{ input: 69.1 }, { output: 69.1 }]],
	[[{ input: 0.1 }, { output: 0.1 }]],
	[[{ input: -420.1 }, { output: -420.1 }]]
);
