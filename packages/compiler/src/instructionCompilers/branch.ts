import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { br } from '../wasmUtils/instructionHelpers';
import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const branch: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.EXPECTED_VALUE, line, context);
		} else {
			return saveByteCode(context, br(line.arguments[0].value));
		}
	}
);

export default branch;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'branch (int)',
	`module block

int output

block void
branch 1
push &output
push 1
store
blockEnd
    
moduleEnd
`,
	[[{}, { output: 0 }]]
);
}
