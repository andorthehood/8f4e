import type { CompilerASTLine } from '@8f4e/language-spec';
import { BlockType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import ifEnd from './ifEnd';

describe('ifEnd instruction compiler', () => {
	it('ends a conditional block with result', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.CONDITION,
					expectedResultTypes: ['int'],
				},
			],
		});
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			ifEnd,
			{
				lineNumber: 1,
				instruction: 'ifEnd',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('ends a conditional block with multiple results', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.CONDITION,
					expectedResultTypes: ['int', 'float'],
				},
			],
		});
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });
		context.stack.push({ kind: 'value', valueType: 'float', isNonZero: false });

		analyzeAndCompileInstruction(
			ifEnd,
			{
				lineNumber: 1,
				instruction: 'ifEnd',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
