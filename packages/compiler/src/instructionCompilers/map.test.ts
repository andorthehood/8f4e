import { describe, expect, it } from 'vitest';

import map from './map';

import { ArgumentType, BLOCK_TYPE } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('map instruction compiler', () => {
	it('records an int key→int value row', () => {
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

		map(
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

		expect(context.blockStack[context.blockStack.length - 1].mapState!.rows).toMatchSnapshot();
	});

	it('accepts single-character string literals as ASCII int key/value', () => {
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

		map(
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

		expect(context.blockStack[context.blockStack.length - 1].mapState!.rows).toEqual([
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

		expect(() => {
			map(
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
			map(
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
