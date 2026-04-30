import { describe, expect, it } from 'vitest';

import _localSet from './localSet';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('localSet instruction compiler', () => {
	it('stores a local value', () => {
		const context = createInstructionCompilerTestContext({
			locals: {
				value: { isInteger: true, index: 0 },
			},
		});
		context.stack.push({ isInteger: true, isNonZero: false });

		_localSet(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'localSet',
				arguments: [classifyIdentifier('value')],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
