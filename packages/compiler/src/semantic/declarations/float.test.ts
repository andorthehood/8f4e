import { describe, expect, it } from 'vitest';

import float from './float';

import createInstructionCompilerTestContext from '../../utils/testUtils';

import type { AST } from '../../types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('float instruction compiler', () => {
	it('creates a float memory entry', () => {
		const context = createInstructionCompilerTestContext();

		float(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'float',
				arguments: [classifyIdentifier('temperature')],
			} as AST[number],
			context
		);

		expect(context.namespace.memory).toMatchSnapshot();
	});
});
