import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import block from './block';

describe('block instruction compiler', () => {
	it('emits a typed block for float', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			block,
			{
				lineNumber: 1,
				instruction: 'block',
				arguments: [],
				blockBlock: { matchingBlockEndIndex: 2, resultTypes: ['float'] },
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits a typed block for int', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			block,
			{
				lineNumber: 1,
				instruction: 'block',
				arguments: [],
				blockBlock: { matchingBlockEndIndex: 2, resultTypes: ['int'] },
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits a void block when no result type is declared', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			block,
			{
				lineNumber: 1,
				instruction: 'block',
				arguments: [],
				blockBlock: { matchingBlockEndIndex: 2, resultTypes: [] },
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
