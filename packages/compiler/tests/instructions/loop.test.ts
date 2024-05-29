import { moduleTester } from './testUtils';

moduleTester(
	'loop',
	`module loop
int counter

loop
 push counter
 push 10
 equal
 branchIfTrue 1

 push &counter
 push counter
 push 1
 add
 store
loopEnd

moduleEnd
`,
	[[{}, { counter: 10 }]]
);

moduleTester(
	'infinite loop protection',
	`module loop
int counter

loop
 push &counter
 push counter
 push 1
 add
 store
loopEnd

moduleEnd
`,
	[[{}, { counter: 1000 }]]
);
