import { describe, expect, it } from 'vitest';
import { ArgumentType, BlockType } from '@8f4e/compiler-spec';

import loopCap from './loopCap';

import { validateInstruction } from '../stackAnalysis/validateInstruction';
import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('#loopCap instruction compiler', () => {
	it('sets loopCap on context when in module block', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
		});

		analyzeAndCompileInstruction(
			loopCap,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: '#loopCap',
				arguments: [{ type: ArgumentType.LITERAL, value: 500, isInteger: true }],
				isBlockPrologue: true,
			} as AST[number],
			context
		);

		expect(context.loopCap).toBe(500);
	});

	it('sets loopCap on context when in function block', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
		});

		analyzeAndCompileInstruction(
			loopCap,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: '#loopCap',
				arguments: [{ type: ArgumentType.LITERAL, value: 2048, isInteger: true }],
				isBlockPrologue: true,
			} as AST[number],
			context
		);

		expect(context.loopCap).toBe(2048);
	});

	it('accepts zero as a valid cap', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
		});

		analyzeAndCompileInstruction(
			loopCap,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: '#loopCap',
				arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
				isBlockPrologue: true,
			} as AST[number],
			context
		);

		expect(context.loopCap).toBe(0);
	});

	it('updates loopCap when called multiple times', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
		});

		analyzeAndCompileInstruction(
			loopCap,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: '#loopCap',
				arguments: [{ type: ArgumentType.LITERAL, value: 500, isInteger: true }],
				isBlockPrologue: true,
			} as AST[number],
			context
		);

		expect(context.loopCap).toBe(500);

		analyzeAndCompileInstruction(
			loopCap,
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: '#loopCap',
				arguments: [{ type: ArgumentType.LITERAL, value: 100, isInteger: true }],
				isBlockPrologue: true,
			} as AST[number],
			context
		);

		expect(context.loopCap).toBe(100);
	});

	it('throws error when used outside module or function block', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [],
		});
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: '#loopCap',
			arguments: [{ type: ArgumentType.LITERAL, value: 500, isInteger: true }],
		} as AST[number];

		expect(() => {
			validateInstruction(line, context);
		}).toThrow();
	});
});
