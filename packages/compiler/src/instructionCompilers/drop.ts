import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils';

import type { InstructionCompiler } from '../types';

const drop: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		context.stack.pop();

		return saveByteCode(context, [WASMInstruction.DROP]);
	}
);

export default drop;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'drop',
	`module drop

push 1
drop

moduleEnd
`,
	[]
);
}
