import { moduleTester } from './testUtils';

moduleTester(
	'int: bare anonymous zero-initialized allocation',
	`module test
int
int output
push &output
push __anonymous__1
store
moduleEnd
`,
	[[{}, { output: 0 }]]
);

moduleTester(
	'int: with literal (anonymous allocation)',
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
	'int: with named identifier',
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
	'int: with named single-character string default',
	`module test
int foo "e"
int output
push &output
push foo
store
moduleEnd
`,
	[[{}, { output: 101, foo: 101 }]]
);

moduleTester(
	'int: with anonymous single-character string default',
	`module test
int "e"
int output
push &output
push __anonymous__1
store
moduleEnd
`,
	[[{}, { output: 101 }]]
);

moduleTester(
	'int: with constant identifier (anonymous allocation)',
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
	'int: multiple anonymous allocations',
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
	'int: mix of anonymous and named allocations',
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
	'int: anonymous allocation with negative literal',
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
	'int: named split hex default (2 bytes, right-padded)',
	`module test
int foo 0xA8 0xFF
int output
push &output
push foo
store
moduleEnd
`,
	[[{}, { output: 0xa8ff0000 | 0 }]]
);

moduleTester(
	'int: named split hex default (4 bytes)',
	`module test
int foo 0xA8 0xFF 0x00 0x00
int output
push &output
push foo
store
moduleEnd
`,
	[[{}, { output: 0xa8ff0000 | 0 }]]
);

moduleTester(
	'int: anonymous split hex default (2 bytes, right-padded)',
	`module test
int 0xA8 0xFF
int output
push &output
push __anonymous__1
store
moduleEnd
`,
	[[{}, { output: 0xa8ff0000 | 0 }]]
);

moduleTester(
	'int: named split decimal default (2 bytes, right-padded)',
	`module test
int foo 32 64
int output
push &output
push foo
store
moduleEnd
`,
	// 32=0x20, 64=0x40 → [0x20, 0x40, 0x00, 0x00] = 0x20400000
	[[{}, { output: 0x20400000 | 0 }]]
);

moduleTester(
	'int: named string split-byte default (2 bytes, right-padded)',
	`module test
int foo "AB"
int output
push &output
push foo
store
moduleEnd
`,
	[[{}, { output: 0x41420000 | 0 }]]
);

moduleTester(
	'int: named split decimal default (4 bytes)',
	`module test
int foo 32 64 0 0
int output
push &output
push foo
store
moduleEnd
`,
	[[{}, { output: 0x20400000 | 0 }]]
);

moduleTester(
	'int: anonymous split decimal default (2 bytes, right-padded)',
	`module test
int 32 64
int output
push &output
push __anonymous__1
store
moduleEnd
`,
	[[{}, { output: 0x20400000 | 0 }]]
);

moduleTester(
	'int: single decimal literal remains anonymous int with that value',
	`module test
int 32
int output
push &output
push __anonymous__1
store
moduleEnd
`,
	[[{}, { output: 32 }]]
);

moduleTester(
	'int: mixed hex and decimal bytes in split-byte default',
	`module test
int foo 0xA8 255
int output
push &output
push foo
store
moduleEnd
`,
	// 0xA8=168, 255=0xFF → [168, 255, 0, 0] = 0xA8FF0000
	[[{}, { output: 0xa8ff0000 | 0 }]]
);

moduleTester(
	'int: named constant split-byte default (2 constants)',
	`module test
const HI 32
const LO 64
int foo HI LO
int output
push &output
push foo
store
moduleEnd
`,
	// HI=32=0x20, LO=64=0x40 → [0x20, 0x40, 0x00, 0x00] = 0x20400000
	[[{}, { output: 0x20400000 | 0 }]]
);

moduleTester(
	'int: anonymous constant split-byte default (2 constants)',
	`module test
const HI 32
const LO 64
int HI LO
int output
push &output
push __anonymous__3
store
moduleEnd
`,
	// HI=32=0x20, LO=64=0x40 → [0x20, 0x40, 0x00, 0x00] = 0x20400000
	[[{}, { output: 0x20400000 | 0 }]]
);

moduleTester(
	'int: named mixed byte literal and constant split-byte',
	`module test
const LO 64
int foo 0xA8 LO
int output
push &output
push foo
store
moduleEnd
`,
	// 0xA8=168, LO=64=0x40 → [168, 64, 0, 0] = 0xA8400000
	[[{}, { output: 0xa8400000 | 0 }]]
);

moduleTester(
	'int: anonymous byte literal and constant split-byte',
	`module test
const LO 64
int 0xA8 LO
int output
push &output
push __anonymous__2
store
moduleEnd
`,
	// 0xA8=168, LO=64=0x40 → [168, 64, 0, 0] = 0xA8400000
	[[{}, { output: 0xa8400000 | 0 }]]
);

moduleTester(
	'int*: bare anonymous zero-initialized pointer allocation',
	`module test
int*
int output
push &output
push __anonymous__1
store
moduleEnd
`,
	[[{}, { output: 0 }]]
);
