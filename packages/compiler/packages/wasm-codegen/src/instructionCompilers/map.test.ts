import type { CompilationContext, CompilerASTLine, MapBlockState } from '@8f4e/language-spec';
import { ArgumentType, BlockType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import map from './map';

function getActiveMapState(context: CompilationContext): MapBlockState {
	const block = context.activeMapBlock;

	if (!block) {
		throw new Error('Expected active map block');
	}

	return block.mapState;
}

describe('map instruction compiler', () => {
	it('records an int key→int value row', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultTypes: [],
				},
				{
					blockType: BlockType.MAP,
					expectedResultTypes: [],
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
				lineNumber: 1,
				instruction: 'map',
				arguments: [
					{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
					{ type: ArgumentType.LITERAL, value: 100, isInteger: true },
				],
			} as CompilerASTLine,
			context
		);

		expect(getActiveMapState(context).rows).toMatchSnapshot();
	});

	it('accepts single-character string literals as ASCII int key/value', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultTypes: [],
				},
				{
					blockType: BlockType.MAP,
					expectedResultTypes: [],
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
				lineNumber: 1,
				instruction: 'map',
				arguments: [
					{ type: ArgumentType.STRING_LITERAL, value: 'A' },
					{ type: ArgumentType.STRING_LITERAL, value: 'B' },
				],
			} as CompilerASTLine,
			context
		);

		expect(getActiveMapState(context).rows).toEqual([
			{
				keyValue: 65,
				valueValue: 66,
				valueIsInteger: true,
				valueIsFloat64: false,
			},
		]);
	});

	it('records a resolved implicit key row', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultTypes: [],
				},
				{
					blockType: BlockType.MAP,
					expectedResultTypes: [],
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
				lineNumber: 2,
				instruction: 'map',
				arguments: [
					{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
					{ type: ArgumentType.LITERAL, value: 200, isInteger: true },
				],
			} as CompilerASTLine,
			context
		);

		expect(getActiveMapState(context).rows.at(-1)).toEqual({
			keyValue: 1,
			valueValue: 200,
			valueIsInteger: true,
			valueIsFloat64: false,
		});
	});
});
