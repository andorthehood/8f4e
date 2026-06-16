import type { CompilerASTLine } from '@8f4e/language-spec';
import { BlockType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import _else from './else';

describe('else instruction compiler', () => {
	it('emits else bytecode and restores block', () => {
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
			_else,
			{
				lineNumber: 1,
				instruction: 'else',
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

	it('throws when no matching block start exists', () => {
		const context = createInstructionCompilerTestContext({ blockStack: [] });

		expect(() => {
			analyzeAndCompileInstruction(
				_else,
				{
					lineNumber: 1,
					instruction: 'else',
					arguments: [],
				} as CompilerASTLine,
				context
			);
		}).toThrowError();
	});
});
