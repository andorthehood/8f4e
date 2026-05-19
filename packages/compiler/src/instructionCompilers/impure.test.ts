import { describe, expect, it } from 'vitest';
import { BlockType } from '@8f4e/compiler-spec';

import impure from './impure';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('impure instruction compiler', () => {
	it('sets currentFunctionIsImpure when in function context', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
			mode: 'function',
			codeBlockType: 'function',
		});

		impure(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: '#impure',
				arguments: [],
				isBlockPrologue: true,
			} as AST[number],
			context
		);

		expect(context.currentFunctionIsImpure).toBe(true);
	});

	it('throws error when used outside function block', () => {
		const context = createInstructionCompilerTestContext();

		expect(() => {
			impure(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: '#impure',
					arguments: [],
				} as AST[number],
				context
			);
		}).toThrow();
	});
});
