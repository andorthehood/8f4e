import { moduleTester } from './testUtils';

moduleTester(
	'hasChanged with int',
	`module hasChanged

int input 
int output

push &output
 push input
 hasChanged
 if int
  push 1
 else
  push 0
 ifEnd
store

moduleEnd
`,
	[
		[{ input: 10 }, { output: 1 }],
		[{ input: 10 }, { output: 0 }],
		[{ input: 10 }, { output: 0 }],
		[{ input: 11 }, { output: 1 }],
		[{ input: 11 }, { output: 0 }],
		[{ input: 10 }, { output: 1 }],
		[{ input: 12 }, { output: 1 }],
		[{ input: 12 }, { output: 0 }],
	]
);

moduleTester(
	'hasChanged with float',
	`module hasChanged

float input 
int output

push &output
 push input
 hasChanged
 if int
  push 1
 else
  push 0
 ifEnd
store

moduleEnd
`,
	[
		[{ input: 1.5 }, { output: 1 }],
		[{ input: 1.5 }, { output: 0 }],
		[{ input: 1.5 }, { output: 0 }],
		[{ input: 2.5 }, { output: 1 }],
		[{ input: 2.5 }, { output: 0 }],
		[{ input: 1.5 }, { output: 1 }],
		[{ input: 3.0 }, { output: 1 }],
		[{ input: 3.0 }, { output: 0 }],
	]
);
