import type { CompilationContext, CompilerASTLine, MapBlockState } from '@8f4e/compiler-spec';
import { ArgumentType, BlockType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import map from './map';

function getTopMapState(context: CompilationContext): MapBlockState {
	const block = context.blockStack[context.blockStack.length - 1];

	if (block?.blockType !== BlockType.MAP) {
		throw new Error('Expected top block to be a map block');
	}

	return block.mapState;
}

describe('map instruction compiler', () => {
	it('records an int key→int value row', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,expectedResultTypes: [],
				},
				{
					blockType: BlockType.MAP,expectedResultTypes: [],
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
			} as CompilerASTLine,
			context
		);

		expect(getTopMapState(context).rows).toMatchSnapshot();
	});

	it('accepts single-character string literals as ASCII int key/value', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,expectedResultTypes: [],
				},
				{
					blockType: BlockType.MAP,expectedResultTypes: [],
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
			} as CompilerASTLine,
			context
		);

		expect(getTopMapState(context).rows).toEqual([
			{
				keyValue: 65,
				valueValue: 66,
				valueIsInteger: true,
				valueIsFloat64: false,
			},
		]);
	});

	it('records a normalized implicit key row', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,expectedResultTypes: [],
				},
				{
					blockType: BlockType.MAP,expectedResultTypes: [],
					mapState: {
						inputIsInteger: true,
						inputIsFloat64: false,
						rows: [
							{
								keyValue: 0,
								valueValue: 100,
								valueIsInteger: true,
								valueIsFloat64: false,
							},
						],
						defaultSet: false,
					},
				},
			],
		});

		analyzeAndCompileInstruction(
			map,
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'map',
				arguments: [
					{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
					{ type: ArgumentType.LITERAL, value: 200, isInteger: true },
				],
			} as CompilerASTLine,
			context
		);

		expect(getTopMapState(context).rows.at(-1)).toEqual({
			keyValue: 1,
			valueValue: 200,
			valueIsInteger: true,
			valueIsFloat64: false,
		});
	});

	it('throws when key type mismatches int inputType', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,expectedResultTypes: [],
				},
				{
					blockType: BlockType.MAP,expectedResultTypes: [],
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
				} as CompilerASTLine,
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
				} as CompilerASTLine,
				context
			);
		}).toThrowError();
	});
});
