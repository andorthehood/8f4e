import { moduleTester } from './testUtils';

moduleTester(
	'fallingEdge',
	`module fallingEdge

int input 
int output

push &output
 push input
 fallingEdge
 if int
  push 1
 else
  push 0
 ifEnd
store

moduleEnd
`,
	[
		[{ input: 10 }, { output: 0 }],
		[{ input: 11 }, { output: 0 }],
		[{ input: 12 }, { output: 0 }],
		[{ input: 9 }, { output: 1 }],
		[{ input: 12 }, { output: 0 }],
		[{ input: 12 }, { output: 0 }],
		[{ input: 10 }, { output: 1 }],
		[{ input: 10 }, { output: 0 }],
	]
);
