import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import local from './local';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('local instruction compiler', () => {
	it('adds a local variable', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			local,
			{
				lineNumber: 1,
				instruction: 'local',
				arguments: [classifyIdentifier('int'), classifyIdentifier('count')],
			} as CompilerASTLine,
			context
		);

		expect(context.locals).toMatchSnapshot();
	});

	it('adds a pointer local variable with pointee metadata', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			local,
			{
				lineNumber: 1,
				instruction: 'local',
				arguments: [classifyIdentifier('float64**'), classifyIdentifier('cursor')],
			} as CompilerASTLine,
			context
		);

		expect(context.locals.cursor).toMatchObject({
			pointeeBaseType: 'float64',
			pointerDepth: 2,
			index: 0,
		});
	});
});
