import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils';

import type { InstructionCompiler } from '../types';

const clearStack: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		const length = context.stack.length;
		context.stack = [];

		return saveByteCode(context, new Array(length).fill(WASMInstruction.DROP));
	}
);

export default clearStack;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'clearStack',
	`module clearStack

push 1
push 1
clearStack

moduleEnd
`,
	[]
);
}
