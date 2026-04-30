import { describe, expect, it } from 'vitest';
import { BLOCK_TYPE } from '@8f4e/compiler-types';

import _else from './else';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('else instruction compiler', () => {
	it('emits else bytecode and restores block', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BLOCK_TYPE.CONDITION,
					expectedResultIsInteger: true,
					hasExpectedResult: true,
				},
			],
		});
		context.stack.push({ isInteger: true, isNonZero: false });

		_else(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'else',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('throws when no matching block start exists', () => {
		const context = createInstructionCompilerTestContext({ blockStack: [] });

		expect(() => {
			_else(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'else',
					arguments: [],
				} as AST[number],
				context
			);
		}).toThrowError();
	});
});
