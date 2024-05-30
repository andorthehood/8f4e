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
