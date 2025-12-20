import { BLOCK_TYPE } from '../types';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const initBlock: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.INIT,
		});

		return context;
	}
);

export default initBlock;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

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
}
