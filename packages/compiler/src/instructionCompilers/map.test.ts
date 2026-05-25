import { describe, expect, it } from 'vitest';
import { ArgumentType, BlockType } from '@8f4e/compiler-spec';

import map from './map';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('map instruction compiler', () => {
	function getTopMapRows(context: ReturnType<typeof createInstructionCompilerTestContext>) {
		const block = context.blockStack[context.blockStack.length - 1];

		if (block?.blockType !== BlockType.MAP) {
			throw new Error('Expected top block to be a map block');
		}

		return block.mapState.rows;
	}

	it('records an int key→int value row', () => {
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
			map,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'map',
				arguments: [
					{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
					{ type: ArgumentType.LITERAL, value: 100, isInteger: true },
				],
			} as AST[number],
			context
		);

		expect(getTopMapRows(context)).toMatchSnapshot();
	});

	it('accepts single-character string literals as ASCII int key/value', () => {
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
			map,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'map',
				arguments: [
					{ type: ArgumentType.STRING_LITERAL, value: 'A' },
					{ type: ArgumentType.STRING_LITERAL, value: 'B' },
				],
			} as AST[number],
			context
		);

		expect(getTopMapRows(context)).toEqual([
			{
				keyValue: 65,
				valueValue: 66,
				valueIsInteger: true,
				valueIsFloat64: false,
			},
		]);
	});

	it('throws when key type mismatches int inputType', () => {
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

		expect(() => {
			analyzeAndCompileInstruction(
				map,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'map',
					arguments: [
						{ type: ArgumentType.LITERAL, value: 1.5, isInteger: false },
						{ type: ArgumentType.LITERAL, value: 100, isInteger: true },
					],
				} as AST[number],
				context
			);
		}).toThrowError();
	});

	it('throws when used outside a map block', () => {
		const context = createInstructionCompilerTestContext();

		expect(() => {
			analyzeAndCompileInstruction(
				map,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'map',
					arguments: [
						{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
						{ type: ArgumentType.LITERAL, value: 100, isInteger: true },
					],
				} as AST[number],
				context
			);
		}).toThrowError();
	});
});
