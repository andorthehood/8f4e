import { moduleTester } from './testUtils';

// Test fraction literals in push instruction
moduleTester(
	'push: with fraction literal (1/16)',
	`module test
float output 0
push &output
push 1/16
store
moduleEnd
`,
	[[{}, { output: 0.0625 }]]
);

// Test fraction literals in int instruction (truncation to zero)
moduleTester(
	'int: with fraction literal (1/16) truncates to 0',
	`module test
int foo 1/16
int output
push &output
push foo
store
moduleEnd
`,
	[[{}, { output: 0, foo: 0 }]]
);

// Test fraction literals in float instruction
moduleTester(
	'float: with fraction literal (1/16)',
	`module test
float bar 1/16
float output
push &output
push bar
store
moduleEnd
`,
	[[{}, { output: 0.0625, bar: 0.0625 }]]
);

// Test fraction literals with integer result
moduleTester(
	'int: with fraction literal (8/2) equals 4',
	`module test
int foo 8/2
int output
push &output
push foo
store
moduleEnd
`,
	[[{}, { output: 4, foo: 4 }]]
);

// Test fraction literals with negative numbers
moduleTester(
	'float: with negative fraction literal (-1/2)',
	`module test
float bar -1/2
float output
push &output
push bar
store
moduleEnd
`,
	[[{}, { output: -0.5, bar: -0.5 }]]
);

// Test fraction literals in const instruction
moduleTester(
	'const: with fraction literal (1/8)',
	`module test
const MY_FRACTION 1/8
float output
push &output
push MY_FRACTION
store
moduleEnd
`,
	[[{}, { output: 0.125 }]]
);
