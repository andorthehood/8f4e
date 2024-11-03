import { moduleTester } from './testUtils';

moduleTester(
	'initBlock (int)',
	`module ini

int input
int output

initBlock
    push &output
    push 8
    store
initBlockEnd

moduleEnd
`,
	[[{ input: 0 }, { output: 0 }]]
);
