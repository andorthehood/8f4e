import { describe, expect, it } from 'vitest';

import impure from './impure';

import { BLOCK_TYPE } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('impure instruction compiler', () => {
	it('sets currentFunctionIsImpure when in function context', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BLOCK_TYPE.FUNCTION,
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
