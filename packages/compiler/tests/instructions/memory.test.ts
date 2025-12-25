import { moduleTester } from './testUtils';

moduleTester(
	'memory: int with literal (anonymous allocation)',
	`module test
int 42
int output
push &output
push __anonymous__1
store
moduleEnd
`,
	[[{}, { output: 42 }]]
);

moduleTester(
	'memory: int with named identifier',
	`module test
int foo 42
int output
push &output
push foo
store
moduleEnd
`,
	[[{}, { output: 42, foo: 42 }]]
);

moduleTester(
	'memory: int with constant identifier (anonymous allocation)',
	`module test
const MY_VALUE 100
int MY_VALUE
int output
push &output
push __anonymous__2
store
moduleEnd
`,
	[[{}, { output: 100 }]]
);

moduleTester(
	'memory: float with literal (anonymous allocation)',
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
	'memory: float with constant identifier (anonymous allocation)',
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
	'memory: multiple anonymous allocations',
	`module test
int 10
int 20
int 30
int output
push &output
push __anonymous__1
push __anonymous__2
add
push __anonymous__3
add
store
moduleEnd
`,
	[[{}, { output: 60 }]]
);

moduleTester(
	'memory: mix of anonymous and named allocations',
	`module test
int 5
int named 10
int 15
int output
push &output
push __anonymous__1
push named
add
push __anonymous__3
add
store
moduleEnd
`,
	[[{}, { output: 30, named: 10 }]]
);

moduleTester(
	'memory: anonymous allocation with negative literal',
	`module test
int -42
int output
push &output
push __anonymous__1
store
moduleEnd
`,
	[[{}, { output: -42 }]]
);

moduleTester(
	'memory: anonymous float with negative literal',
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
