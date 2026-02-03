import { moduleTester } from './testUtils';

moduleTester(
	'risingEdge',
	`module risingEdge

int input 
int output

push &output
 push input
 risingEdge
 if int
  push 1
 else
  push 0
 ifEnd
store

moduleEnd
`,
	[
		[{ input: 12 }, { output: 1 }],
		[{ input: 11 }, { output: 0 }],
		[{ input: 10 }, { output: 0 }],
		[{ input: 12 }, { output: 1 }],
		[{ input: 12 }, { output: 0 }],
		[{ input: 12 }, { output: 0 }],
		[{ input: 13 }, { output: 1 }],
		[{ input: 10 }, { output: 0 }],
	]
);

moduleTester(
	'risingEdge (float)',
	`module risingEdgeFloat

float input
int output

push &output
 push input
 risingEdge
 if int
  push 1
 else
  push 0
 ifEnd
store

moduleEnd
`,
	[
		[{ input: 12.01 }, { output: 1 }],
		[{ input: 11.5 }, { output: 0 }],
		[{ input: 11.5 }, { output: 0 }],
		[{ input: 12.1 }, { output: 1 }],
		[{ input: 12.1 }, { output: 0 }],
		[{ input: 12.01 }, { output: 0 }],
		[{ input: 12.2 }, { output: 1 }],
		[{ input: 11.9 }, { output: 0 }],
	]
);
