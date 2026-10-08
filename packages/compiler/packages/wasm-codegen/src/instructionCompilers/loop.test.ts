import type { CompilerASTLine } from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import loop from './loop';

describe('loop instruction compiler', () => {
	it('compiles the loop segment with default cap', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			loop,
			{
				lineNumber: 2,
				instruction: 'loop',
				arguments: [{ type: ArgumentType.LITERAL, value: 1000, isInteger: true }],
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('compiles the loop segment with explicit cap argument', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			loop,
			{
				lineNumber: 2,
				instruction: 'loop',
				arguments: [{ type: ArgumentType.LITERAL, value: 32, isInteger: true }],
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('compiles a smaller resolved cap', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			loop,
			{
				lineNumber: 2,
				instruction: 'loop',
				arguments: [{ type: ArgumentType.LITERAL, value: 10, isInteger: true }],
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
