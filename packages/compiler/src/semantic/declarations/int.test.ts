import { describe, expect, it } from 'vitest';

import int from './int';

import createInstructionCompilerTestContext from '../../utils/testUtils';

import type { AST } from '../../types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('int instruction compiler', () => {
	it('creates an int memory entry', () => {
		const context = createInstructionCompilerTestContext();

		int(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int',
				arguments: [classifyIdentifier('counter')],
			} as AST[number],
			context
		);

		expect(context.namespace.memory).toMatchSnapshot();
	});
});
