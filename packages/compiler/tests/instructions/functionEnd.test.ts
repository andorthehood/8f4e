import { moduleTesterWithFunctions } from './testUtils';

moduleTesterWithFunctions(
	'functionEnd with int return',
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
	'functionEnd with float return',
	`module test
float output

loop
  push &output
  call getPi
  store
loopEnd

moduleEnd`,
	[
		`function getPi
push 3.14
functionEnd float`,
	],
	[[{}, { output: 3.14 }]]
);

moduleTesterWithFunctions(
	'functionEnd validates stack',
	`module test
int output

loop
  push &output
  call addTwo
  store
loopEnd

moduleEnd`,
	[
		`function addTwo
push 5
push 3
add
functionEnd int`,
	],
	[[{}, { output: 8 }]]
);
