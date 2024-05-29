import { moduleTester } from './testUtils';

moduleTester(
	'if (int)',
	`module if
int input 
int output

push &output
 push input
 if int
  push 1
 else
  push -1
 ifEnd
store

moduleEnd
`,
	[[{ input: 1 }, { output: 1 }]],
	[[{ input: 0 }, { output: -1 }]]
);

moduleTester(
	'if (float)',
	`module if
int input 
float output

push &output
 push input
 if float
  push 1.1
 else
  push -1.1
 ifEnd
store

moduleEnd
`,
	[[{ input: 1 }, { output: 1.1 }]],
	[[{ input: 0 }, { output: -1.1 }]]
);

moduleTester(
	'if (void)',
	`module if
int input 
int output

push input
if void
 push &output
  push 1
 store
else
 push &output
  push -1
 store
ifEnd

moduleEnd
`,
	[[{ input: 1 }, { output: 1 }]],
	[[{ input: 0 }, { output: -1 }]]
);
