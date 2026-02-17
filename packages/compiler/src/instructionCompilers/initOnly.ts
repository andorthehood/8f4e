import { BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `#initOnly` compiler directive.
 * Marks a module to execute once during init and skip execution in the cycle dispatcher.
 */
const initOnly: InstructionCompiler = function (line, context) {
	// Verify that we're within a module block
	const isInModuleBlock = context.blockStack.some(block => block.blockType === BLOCK_TYPE.MODULE);

	if (!isInModuleBlock) {
		throw getError(ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT, line, context);
	}

	// Set the metadata flag (idempotent - multiple calls have no additional effect)
	context.initOnlyExecution = true;

	return context;
};

export default initOnly;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('initOnly instruction compiler', () => {
		it('sets initOnlyExecution flag when in module context', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					{
						blockType: BLOCK_TYPE.MODULE,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
			});

			initOnly(
				{
					lineNumber: 1,
					instruction: '#initOnly',
					arguments: [],
				} as AST[number],
				context
			);

			expect(context.initOnlyExecution).toBe(true);
		});

		it('throws error when used outside module block', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [],
			});

			expect(() => {
				initOnly(
					{
						lineNumber: 1,
						instruction: '#initOnly',
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

			initOnly(
				{
					lineNumber: 1,
					instruction: '#initOnly',
					arguments: [],
				} as AST[number],
				context
			);

			expect(context.initOnlyExecution).toBe(true);

			initOnly(
				{
					lineNumber: 2,
					instruction: '#initOnly',
					arguments: [],
				} as AST[number],
				context
			);

			expect(context.initOnlyExecution).toBe(true);
		});
	});
}
