import { describe, expect, it } from 'vitest';
import { BLOCK_TYPE } from '@8f4e/compiler-types';

import skipExecution from './skipExecution';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

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
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
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
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
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
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: '#skipExecution',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.skipExecutionInCycle).toBe(true);

		skipExecution(
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: '#skipExecution',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.skipExecutionInCycle).toBe(true);
	});
});
