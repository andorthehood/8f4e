import { BLOCK_TYPE } from '../types';
import { ErrorCode } from '../compilerError';
import { withValidation } from '../withValidation';
import { ArgumentType } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler, LoopCapLine } from '../types';

/**
 * Instruction compiler for `#loopCap` compiler directive.
 * Sets the default loop cap for subsequent loops in the current module or function block.
 * @see [Directive docs](../../docs/directives.md)
 */
const loopCap: InstructionCompiler<LoopCapLine> = withValidation(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT,
		minArguments: 1,
		argumentTypes: ['nonNegativeIntegerLiteral'],
	},
	(line, context) => {
		context.loopCap = line.arguments[0].value as number;
		return context;
	}
);

export default loopCap;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('#loopCap instruction compiler', () => {
		it('sets loopCap on context when in module block', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					{
						blockType: BLOCK_TYPE.MODULE,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
			});

			loopCap(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: '#loopCap',
					arguments: [{ type: ArgumentType.LITERAL, value: 500, isInteger: true }],
				} as AST[number],
				context
			);

			expect(context.loopCap).toBe(500);
		});

		it('sets loopCap on context when in function block', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					{
						blockType: BLOCK_TYPE.FUNCTION,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
			});

			loopCap(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: '#loopCap',
					arguments: [{ type: ArgumentType.LITERAL, value: 2048, isInteger: true }],
				} as AST[number],
				context
			);

			expect(context.loopCap).toBe(2048);
		});

		it('accepts zero as a valid cap', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					{
						blockType: BLOCK_TYPE.MODULE,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
			});

			loopCap(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: '#loopCap',
					arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
				} as AST[number],
				context
			);

			expect(context.loopCap).toBe(0);
		});

		it('updates loopCap when called multiple times', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					{
						blockType: BLOCK_TYPE.MODULE,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
			});

			loopCap(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: '#loopCap',
					arguments: [{ type: ArgumentType.LITERAL, value: 500, isInteger: true }],
				} as AST[number],
				context
			);

			expect(context.loopCap).toBe(500);

			loopCap(
				{
					lineNumberBeforeMacroExpansion: 2,
					lineNumberAfterMacroExpansion: 2,
					instruction: '#loopCap',
					arguments: [{ type: ArgumentType.LITERAL, value: 100, isInteger: true }],
				} as AST[number],
				context
			);

			expect(context.loopCap).toBe(100);
		});

		it('throws error when used outside module or function block', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [],
			});

			expect(() => {
				loopCap(
					{
						lineNumberBeforeMacroExpansion: 1,
						lineNumberAfterMacroExpansion: 1,
						instruction: '#loopCap',
						arguments: [{ type: ArgumentType.LITERAL, value: 500, isInteger: true }],
					} as AST[number],
					context
				);
			}).toThrow();
		});
	});
}
