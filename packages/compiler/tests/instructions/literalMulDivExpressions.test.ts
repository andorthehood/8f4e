import { moduleTester } from './testUtils';

moduleTester(
	'const: literal-only multiplication expression',
	`module test

const RESULT 16*2
int output

push &output
push RESULT
store

moduleEnd
`,
	[[{}, { output: 32 }]]
);

moduleTester(
	'const: literal-only division expression with integer result',
	`module test

const RESULT 8/2
int output

push &output
push RESULT
store

moduleEnd
`,
	[[{}, { output: 4 }]]
);

moduleTester(
	'push: literal-only multiplication expression',
	`module test

int output

push &output
push 16*2
store

moduleEnd
`,
	[[{}, { output: 32 }]]
);

moduleTester(
	'push: literal-only division expression with float result',
	`module test

float output

push &output
push 1/2
store

moduleEnd
`,
	[[{}, { output: 0.5 }]]
);

moduleTester(
	'push: hex literal in multiplication expression',
	`module test

int output

push &output
push 0x10*2
store

moduleEnd
`,
	[[{}, { output: 32 }]]
);

moduleTester(
	'push: hex literal in division expression',
	`module test

int output

push &output
push 0x10/2
store

moduleEnd
`,
	[[{}, { output: 8 }]]
);

moduleTester(
	'push: float literal multiplication with float-typed result',
	`module test

float output

push &output
push 3.5*4
store

moduleEnd
`,
	[[{}, { output: 14 }]]
);

moduleTester(
	'memory declaration: literal-only multiplication expression default',
	`module test

int foo 4*3

int output
push &output
push foo
store

moduleEnd
`,
	[[{}, { output: 12, foo: 12 }]]
);

moduleTester(
	'int[]: buffer size from literal multiplication expression',
	`module test

int[] buffer 4*2
int output

push &output
push count(buffer)
store

moduleEnd
`,
	[[{}, { output: 8 }]]
);
