import { describe, expect, it } from 'vitest';
import { BLOCK_TYPE } from '@8f4e/compiler-types';

import initOnly from './initOnly';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

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
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
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
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
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
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: '#initOnly',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.initOnlyExecution).toBe(true);

		initOnly(
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: '#initOnly',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.initOnlyExecution).toBe(true);
	});
});
