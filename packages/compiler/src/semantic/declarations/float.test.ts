import type { MemoryDeclarationLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext from '../../utils/testUtils';
import float from './float';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('float instruction compiler', () => {
	it('creates a float memory entry', () => {
		const context = createInstructionCompilerTestContext();

		float(
			{
				lineNumber: 1,
				instruction: 'float',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('temperature')],
			} satisfies MemoryDeclarationLine,
			context
		);

		expect(context.namespace.memory).toMatchSnapshot();
	});
});
