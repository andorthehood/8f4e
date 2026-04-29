import { test, expect } from 'vitest';

import { moduleTester } from './testUtils';

import compile from '../../src';

moduleTester(
	'int[]: buffer size from constant division expression',
	`module test
const SIZE 8
int[] buffer SIZE/2
int output
push &output
push count(buffer)
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
push count(buffer)
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
	'const: signed literal / constant',
	`module test
const FOO 8
const BAR -1/FOO
float output
push &output
push BAR
store
moduleEnd
`,
	[[{}, { output: -0.125 }]]
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

moduleTester(
	'const: literal * sizeof(name)',
	`module test
int16[] samples 4
const BYTE_SIZE 123*sizeof(samples)
int output
push &output
push BYTE_SIZE
store
moduleEnd
`,
	[[{}, { output: 246 }]]
);

moduleTester(
	'const: sizeof(name) * literal',
	`module test
int16[] samples 4
const BYTE_SIZE sizeof(samples)*2
int output
push &output
push BYTE_SIZE
store
moduleEnd
`,
	[[{}, { output: 4 }]]
);

moduleTester(
	'const: constant * sizeof(name)',
	`module test
int16[] samples 4
const SIZE 8
const TOTAL SIZE*sizeof(samples)
int output
push &output
push TOTAL
store
moduleEnd
`,
	[[{}, { output: 16 }]]
);

moduleTester(
	'push: sizeof(name) * literal',
	`module test
int16[] samples 4
int output
push &output
push sizeof(samples)*4
store
moduleEnd
`,
	[[{}, { output: 8 }]]
);

moduleTester(
	'push: constant * sizeof(name)',
	`module test
int16[] samples 4
const SIZE 8
int output
push &output
push SIZE*sizeof(samples)
store
moduleEnd
`,
	[[{}, { output: 16 }]]
);

moduleTester(
	'push: literal * sizeof(name)',
	`module test
int16[] samples 4
int output
push &output
push 123*sizeof(samples)
store
moduleEnd
`,
	[[{}, { output: 246 }]]
);

moduleTester(
	'push: literal * constant (literal on lhs)',
	`module test
const SIZE 8
int output
push &output
push 2*SIZE
store
moduleEnd
`,
	[[{}, { output: 16 }]]
);

moduleTester(
	'int[]: buffer size from sizeof expression',
	`module test
int16[] samples 4
int[] buffer sizeof(samples)*2
int output
push &output
push count(buffer)
store
moduleEnd
`,
	[[{}, { output: 4 }]]
);

moduleTester(
	'int[]: buffer size from count expression',
	`module test
int[] source 8
int[] dest count(source)*2
int output
push &output
push count(dest)
store
moduleEnd
`,
	[[{}, { output: 16 }]]
);

test('constants block expressions are available through use', () => {
	const result = compile(
		[
			{
				code: ['constants env', 'const SIZE 8', 'const HALF SIZE/2', 'constantsEnd'],
			},
			{
				code: ['module test', 'use env', 'int output HALF', 'moduleEnd'],
			},
		],
		{ startingMemoryWordAddress: 0 }
	);

	expect(result.compiledModules.test.memoryMap.output.default).toBe(4);
});

moduleTester(
	'const: literal ^ literal folds to a literal value (2^16 = 65536)',
	`module test
const WIDTH 2^16
int output WIDTH
moduleEnd
`,
	[[{}, { output: 65536 }]]
);

moduleTester(
	'const: constant ^ literal expression',
	`module test
const SIZE 4
const TOTAL SIZE^3
int output
push &output
push TOTAL
store
moduleEnd
`,
	[[{}, { output: 64 }]]
);

moduleTester(
	'const: literal ^ constant expression',
	`module test
const EXP 8
const RESULT 2^EXP
int output
push &output
push RESULT
store
moduleEnd
`,
	[[{}, { output: 256 }]]
);

moduleTester(
	'push: literal ^ constant expression',
	`module test
const EXP 4
int output
push &output
push 2^EXP
store
moduleEnd
`,
	[[{}, { output: 16 }]]
);

moduleTester(
	'init: constant ^ literal expression',
	`module test
const SIZE 3
int foo
init foo SIZE^2
int output
push &output
push foo
store
moduleEnd
`,
	[[{}, { output: 9, foo: 9 }]]
);

moduleTester(
	'int[]: buffer size from constant exponentiation expression',
	`module test
const SIZE 2
int[] buffer SIZE^3
int output
push &output
push count(buffer)
store
moduleEnd
`,
	[[{}, { output: 8 }]]
);

moduleTester(
	'const: sizeof(name)^literal',
	`module test
int32[] samples 4
const TOTAL sizeof(samples)^2
int output
push &output
push TOTAL
store
moduleEnd
`,
	[[{}, { output: 16 }]]
);
