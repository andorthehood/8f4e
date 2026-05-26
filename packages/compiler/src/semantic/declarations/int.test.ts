import { describe, expect, it } from 'vitest';

import int from './int';

import createInstructionCompilerTestContext from '../../utils/testUtils';

import type { MemoryDeclarationLine } from '@8f4e/compiler-spec';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('int instruction compiler', () => {
	it('creates an int memory entry', () => {
		const context = createInstructionCompilerTestContext();

		int(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('counter')],
			} satisfies MemoryDeclarationLine,
			context
		);

		expect(context.namespace.memory).toMatchSnapshot();
	});
});
