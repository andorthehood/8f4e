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

moduleTesterWithFunctions(
	'call passes float64 param and return through call without downgrading to float32',
	`module test
float64 input
float64 output

loop
  push &output
  push input
  call axion
  store
loopEnd

moduleEnd`,
	[
		`function axion
param float64 x
localGet x
functionEnd float64`,
	],
	[[{ input: Math.PI }, { output: Math.PI }]]
);

moduleTesterWithFunctions(
	'call float64-returning function',
	`module test
float64 output

loop
  push &output
  call getDoublePI
  store
loopEnd

moduleEnd`,
	[
		`function getDoublePI
push 3.14159265358979f64
push 2.0f64
mul
functionEnd float64`,
	],
	[[{}, { output: 6.28318530717958 }]]
);
