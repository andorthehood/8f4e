import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import loopEnd from './loopEnd';

describe('loopEnd instruction compiler', () => {
	it('ends a loop block', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.LOOP,
					expectedResultTypes: [],
					loopCounterLocalName: '__loopCounter1',
					loopCounterLocal: { kind: 'value', valueType: 'int', index: 0 },
				},
			],
		});

		analyzeAndCompileInstruction(
			loopEnd,
			{
				lineNumber: 1,
				instruction: 'loopEnd',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('throws when missing loop block', () => {
		const context = createInstructionCompilerTestContext();

		expect(() => {
			analyzeAndCompileInstruction(
				loopEnd,
				{
					lineNumber: 1,
					instruction: 'loopEnd',
					arguments: [],
				} as CompilerASTLine,
				context
			);
		}).toThrowError();
	});
});
