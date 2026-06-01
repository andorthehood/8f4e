import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { ArgumentType, BlockType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import { validateInstruction } from '../stackAnalysis/validateInstruction';
import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import loopCap from './loopCap';

describe('#loopCap instruction compiler', () => {
	it('sets loopCap on context when in module block', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultTypes: [],
				},
			],
		});

		analyzeAndCompileInstruction(
			loopCap,
			{
				lineNumber: 1,
				instruction: '#loopCap',
				arguments: [{ type: ArgumentType.LITERAL, value: 500, isInteger: true }],
				isBlockPrologue: true,
			} as CompilerASTLine,
			context
		);

		expect(context.loopCap).toBe(500);
	});

	it('sets loopCap on context when in function block', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.FUNCTION,
					expectedResultTypes: [],
				},
			],
		});

		analyzeAndCompileInstruction(
			loopCap,
			{
				lineNumber: 1,
				instruction: '#loopCap',
				arguments: [{ type: ArgumentType.LITERAL, value: 2048, isInteger: true }],
				isBlockPrologue: true,
			} as CompilerASTLine,
			context
		);

		expect(context.loopCap).toBe(2048);
	});

	it('accepts zero as a valid cap', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultTypes: [],
				},
			],
		});

		analyzeAndCompileInstruction(
			loopCap,
			{
				lineNumber: 1,
				instruction: '#loopCap',
				arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
				isBlockPrologue: true,
			} as CompilerASTLine,
			context
		);

		expect(context.loopCap).toBe(0);
	});

	it('updates loopCap when called multiple times', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultTypes: [],
				},
			],
		});

		analyzeAndCompileInstruction(
			loopCap,
			{
				lineNumber: 1,
				instruction: '#loopCap',
				arguments: [{ type: ArgumentType.LITERAL, value: 500, isInteger: true }],
				isBlockPrologue: true,
			} as CompilerASTLine,
			context
		);

		expect(context.loopCap).toBe(500);

		analyzeAndCompileInstruction(
			loopCap,
			{
				lineNumber: 2,
				instruction: '#loopCap',
				arguments: [{ type: ArgumentType.LITERAL, value: 100, isInteger: true }],
				isBlockPrologue: true,
			} as CompilerASTLine,
			context
		);

		expect(context.loopCap).toBe(100);
	});

	it('throws error when used outside module or function block', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [],
		});
		const line = {
			lineNumber: 1,
			instruction: '#loopCap',
			arguments: [{ type: ArgumentType.LITERAL, value: 500, isInteger: true }],
		} as CompilerASTLine;

		expect(() => {
			validateInstruction(line, context);
		}).toThrow();
	});
});
