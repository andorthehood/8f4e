import { moduleTester } from './testUtils';

moduleTester(
	'float: with literal (anonymous allocation)',
	`module test
float 3.14
float output
push &output
push __anonymous__1
store
moduleEnd
`,
	[[{}, { output: 3.14 }]]
);

moduleTester(
	'float: with constant identifier (anonymous allocation)',
	`module test
const PI 3.14159
float PI
float output
push &output
push __anonymous__2
store
moduleEnd
`,
	[[{}, { output: 3.14159 }]]
);

moduleTester(
	'float: anonymous float with negative literal',
	`module test
float -2.5
float output
push &output
push __anonymous__1
store
moduleEnd
`,
	[[{}, { output: -2.5 }]]
);
