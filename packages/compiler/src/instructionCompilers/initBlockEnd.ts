import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE } from '../types';
import { withValidation } from '../withValidation';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `initBlockEnd`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const initBlockEnd: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		const block = context.blockStack.pop();

		if (!block || block.blockType !== BLOCK_TYPE.INIT) {
			throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
		}

		return context;
	}
);

export default initBlockEnd;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('initBlockEnd instruction compiler', () => {
		it('pops the init block', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					...createInstructionCompilerTestContext().blockStack,
					{
						blockType: BLOCK_TYPE.INIT,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
			});

			initBlockEnd({ lineNumber: 1, instruction: 'initBlockEnd', arguments: [] } as AST[number], context);

			expect({ blockStack: context.blockStack }).toMatchSnapshot();
		});

		it('throws when missing init block', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				initBlockEnd({ lineNumber: 1, instruction: 'initBlockEnd', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
