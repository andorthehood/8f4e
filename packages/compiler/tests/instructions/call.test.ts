import { moduleTesterWithFunctions } from './testUtils';

moduleTesterWithFunctions(
	'call constant function',
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
	'call function with parameter',
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
		`function double
param int x
localGet x
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
	'call function multiple times',
	`module test
int output

loop
  push &output
  call getTwo
  call getThree
  add
  store
loopEnd

moduleEnd`,
	[
		`function getTwo
push 2
functionEnd int`,
		`function getThree
push 3
functionEnd int`,
	],
	[[{}, { output: 5 }]]
);
