import { describe, expect, it } from 'vitest';

import _function from './function';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('function instruction compiler', () => {
	it('starts a new function block', () => {
		const context = createInstructionCompilerTestContext({ blockStack: [] });

		_function(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'function',
				arguments: [classifyIdentifier('doThing')],
			} as AST[number],
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
			_function(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'function',
					arguments: [classifyIdentifier('nested')],
				} as AST[number],
				context
			);
		}).toThrowError();
	});
});
