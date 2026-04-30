import { describe, expect, it } from 'vitest';
import { BLOCK_TYPE } from '@8f4e/compiler-types';

import mapEnd from './mapEnd';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('mapEnd instruction compiler', () => {
	it('throws on missing argument', () => {
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
		context.stack.push({ isInteger: true });

		expect(() => {
			mapEnd(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'mapEnd',
					arguments: [],
				} as AST[number],
				context
			);
		}).toThrowError();
	});

	it('throws when used outside a map block', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true });

		expect(() => {
			mapEnd(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'mapEnd',
					arguments: [classifyIdentifier('int')],
				} as AST[number],
				context
			);
		}).toThrowError();
	});

	it('emits DROP + typed zero for zero rows', () => {
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
		context.stack.push({ isInteger: true });

		mapEnd(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'mapEnd',
				arguments: [classifyIdentifier('int')],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
			blockStack: context.blockStack,
		}).toMatchSnapshot();
	});
});
