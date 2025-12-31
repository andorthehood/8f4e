import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE } from '../types';
import { withValidation } from '../withValidation';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `moduleEnd`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const moduleEnd: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		const block = context.blockStack.pop();

		// Additional validation beyond withValidation's scope check:
		// withValidation ensures we're somewhere inside a module, but we need to verify
		// that the current block being closed is specifically a MODULE block
		if (!block || block.blockType !== BLOCK_TYPE.MODULE) {
			throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
		}

		return context;
	}
);

export default moduleEnd;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('moduleEnd instruction compiler', () => {
		it('pops the module block', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					...createInstructionCompilerTestContext().blockStack,
					{
						blockType: BLOCK_TYPE.MODULE,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
			});

			moduleEnd({ lineNumber: 1, instruction: 'moduleEnd', arguments: [] } as AST[number], context);

			expect({ blockStack: context.blockStack }).toMatchSnapshot();
		});
	});
}
