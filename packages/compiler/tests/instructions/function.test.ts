import { moduleTesterWithFunctions } from './testUtils';

moduleTesterWithFunctions(
	'function returns constant',
	`module test
int output

loop
  push &output
  call getFortyTwo
  store
loopEnd

moduleEnd`,
	[
		`function getFortyTwo
push 42
functionEnd int`,
	],
	[[{}, { output: 42 }]]
);

moduleTesterWithFunctions(
	'function with parameter',
	`module test
int input
int output

loop
  push &output
  push input
  call double
  store
loopEnd

moduleEnd`,
	[
		`function double int
push 2
mul
functionEnd int`,
	],
	[
		[{ input: 5 }, { output: 10 }],
		[{ input: 10 }, { output: 20 }],
	]
);

moduleTesterWithFunctions(
	'function with two parameters',
	`module test
int input1
int input2
int output

loop
  push &output
  push input1
  push input2
  call add
  store
loopEnd

moduleEnd`,
	[
		`function add int int
add
functionEnd int`,
	],
	[
		[{ input1: 3, input2: 4 }, { output: 7 }],
		[{ input1: -5, input2: 10 }, { output: 5 }],
	]
);
