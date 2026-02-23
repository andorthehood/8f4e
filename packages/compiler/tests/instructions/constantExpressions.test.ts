import { moduleTester } from './testUtils';

moduleTester(
	'int[]: buffer size from constant division expression',
	`module test
const SIZE 8
int[] buffer SIZE/2
int output
push &output
push $buffer
store
moduleEnd
`,
	[[{}, { output: 4 }]]
);

moduleTester(
	'int[]: buffer size from constant multiplication expression',
	`module test
const SIZE 8
int[] buffer SIZE*2
int output
push &output
push $buffer
store
moduleEnd
`,
	[[{}, { output: 16 }]]
);

moduleTester(
	'const: expression from another constant',
	`module test
const SIZE 8
const HALF SIZE/2
int output
push &output
push HALF
store
moduleEnd
`,
	[[{}, { output: 4 }]]
);

moduleTester(
	'push: constant expression',
	`module test
const SIZE 8
int output
push &output
push SIZE/2
store
moduleEnd
`,
	[[{}, { output: 4 }]]
);

moduleTester(
	'init: constant expression',
	`module test
const SIZE 8
int foo
init foo SIZE/2
int output
push &output
push foo
store
moduleEnd
`,
	[[{}, { output: 4, foo: 4 }]]
);

