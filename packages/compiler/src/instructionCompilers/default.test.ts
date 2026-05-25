import { describe, expect, it } from 'vitest';
import { ArgumentType, BlockType } from '@8f4e/compiler-spec';

import _default from './default';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('default instruction compiler', () => {
	it('records a default value', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
				{
					blockType: BlockType.MAP,
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

		analyzeAndCompileInstruction(
			_default,
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
			analyzeAndCompileInstruction(
				_default,
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
