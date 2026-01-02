import { BLOCK_TYPE } from '../types';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `initBlock`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
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
	const { describe, it, expect } = import.meta.vitest;

	describe('initBlock instruction compiler', () => {
		it('pushes the init block', () => {
			const context = createInstructionCompilerTestContext();

			initBlock({ lineNumber: 1, instruction: 'initBlock', arguments: [] } as AST[number], context);

			expect({ blockStack: context.blockStack }).toMatchSnapshot();
		});
	});
}
