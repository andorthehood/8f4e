import { BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `#skipExecution` compiler directive.
 * Marks a module to skip execution in the cycle dispatcher while preserving
 * normal compilation and memory initialization behavior.
 */
const skipExecution: InstructionCompiler = function (line, context) {
	// Verify that we're within a module block
	const isInModuleBlock = context.blockStack.some(block => block.blockType === BLOCK_TYPE.MODULE);

	if (!isInModuleBlock) {
		throw getError(ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT, line, context);
	}

	// Set the metadata flag (idempotent - multiple calls have no additional effect)
	context.skipExecutionInCycle = true;

	return context;
};

export default skipExecution;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('skipExecution instruction compiler', () => {
		it('sets skipExecutionInCycle flag when in module context', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					{
						blockType: BLOCK_TYPE.MODULE,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
			});

			skipExecution(
				{
					lineNumber: 1,
					instruction: '#skipExecution',
					arguments: [],
				} as AST[number],
				context
			);

			expect(context.skipExecutionInCycle).toBe(true);
		});

		it('throws error when used outside module block', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [],
			});

			expect(() => {
				skipExecution(
					{
						lineNumber: 1,
						instruction: '#skipExecution',
						arguments: [],
					} as AST[number],
					context
				);
			}).toThrow();
		});

		it('is idempotent - multiple calls have same effect', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					{
						blockType: BLOCK_TYPE.MODULE,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
			});

			skipExecution(
				{
					lineNumber: 1,
					instruction: '#skipExecution',
					arguments: [],
				} as AST[number],
				context
			);

			expect(context.skipExecutionInCycle).toBe(true);

			skipExecution(
				{
					lineNumber: 2,
					instruction: '#skipExecution',
					arguments: [],
				} as AST[number],
				context
			);

			expect(context.skipExecutionInCycle).toBe(true);
		});
	});
}
