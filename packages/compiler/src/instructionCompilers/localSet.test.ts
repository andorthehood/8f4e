import { describe, expect, it } from 'vitest';

import _localSet from './localSet';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('localSet instruction compiler', () => {
	it('stores a local value', () => {
		const local = { isInteger: true, index: 0 };
		const context = createInstructionCompilerTestContext({
			locals: {
				value: local,
			},
		});
		context.stack.push({ isInteger: true, isNonZero: false });

		analyzeAndCompileInstruction(
			_localSet,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'localSet',
				arguments: [classifyIdentifier('value')],
				local,
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
