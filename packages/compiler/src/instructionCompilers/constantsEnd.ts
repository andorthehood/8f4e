import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE } from '../types';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `constantsEnd`.
 */
const constantsEnd: InstructionCompiler = withValidation(
	{
		scope: 'constants',
		allowedInConstantsBlocks: true,
	},
	(line, context) => {
		const block = context.blockStack.pop();

		if (!block || block.blockType !== BLOCK_TYPE.CONSTANTS) {
			throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
		}

		return context;
	}
);

export default constantsEnd;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('constantsEnd instruction compiler', () => {
		it('pops constants block', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					{
						blockType: BLOCK_TYPE.CONSTANTS,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
			});

			constantsEnd({ lineNumber: 1, instruction: 'constantsEnd', arguments: [] } as AST[number], context);

			expect({ blockStack: context.blockStack }).toMatchSnapshot();
		});

		it('throws when missing constants block', () => {
			const context = createInstructionCompilerTestContext({ blockStack: [] });

			expect(() => {
				constantsEnd({ lineNumber: 1, instruction: 'constantsEnd', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
