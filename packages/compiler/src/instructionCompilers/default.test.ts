import { describe, expect, it } from 'vitest';

import _default from './default';

import { ArgumentType, BLOCK_TYPE } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('default instruction compiler', () => {
	it('records a default value', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BLOCK_TYPE.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
				{
					blockType: BLOCK_TYPE.MAP,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
					mapState: {
						inputIsInteger: true,
						inputIsFloat64: false,
						rows: [],
						defaultSet: false,
					},
				},
			],
		});

		_default(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'default',
				arguments: [{ type: ArgumentType.LITERAL, value: 99, isInteger: true }],
			} as AST[number],
			context
		);

		expect({
			mapState: context.blockStack[context.blockStack.length - 1].mapState,
		}).toMatchSnapshot();
	});

	it('throws when used outside a map block', () => {
		const context = createInstructionCompilerTestContext();

		expect(() => {
			_default(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'default',
					arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
				} as AST[number],
				context
			);
		}).toThrowError();
	});
});
