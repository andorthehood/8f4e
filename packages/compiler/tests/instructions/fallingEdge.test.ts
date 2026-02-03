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

moduleTester(
	'fallingEdge (float)',
	`module fallingEdgeFloat

float input
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
		[{ input: 10.1 }, { output: 0 }],
		[{ input: 11.2 }, { output: 0 }],
		[{ input: 12.3 }, { output: 0 }],
		[{ input: 9.9 }, { output: 1 }],
		[{ input: 12.2 }, { output: 0 }],
		[{ input: 12.2 }, { output: 0 }],
		[{ input: 10.8 }, { output: 1 }],
		[{ input: 10.8 }, { output: 0 }],
	]
);
