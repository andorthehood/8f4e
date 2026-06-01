import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import _function from './function';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('function instruction compiler', () => {
	it('starts a new function block', () => {
		const context = createInstructionCompilerTestContext({ blockStack: [] });

		analyzeAndCompileInstruction(
			_function,
			{
				lineNumber: 1,
				instruction: 'function',
				arguments: [classifyIdentifier('doThing')],
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			currentFunctionId: context.currentFunctionId,
			currentFunctionSignature: context.currentFunctionSignature,
			mode: context.mode,
			locals: context.locals,
		}).toMatchSnapshot();
	});

	it('throws when declared inside a module', () => {
		const context = createInstructionCompilerTestContext();

		expect(() => {
			analyzeAndCompileInstruction(
				_function,
				{
					lineNumber: 1,
					instruction: 'function',
					arguments: [classifyIdentifier('nested')],
				} as CompilerASTLine,
				context
			);
		}).toThrowError();
	});
});
