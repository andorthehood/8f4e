import type { MemoryDeclarationLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext from '../../utils/testUtils';
import float from './float';
import { applyPlannedMemoryDeclaration, getTestMemoryMap } from './testUtils';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('float instruction compiler', () => {
	it('creates a float memory entry', () => {
		const context = createInstructionCompilerTestContext();

		applyPlannedMemoryDeclaration(
			float,
			{
				lineNumber: 1,
				instruction: 'float',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('temperature')],
			} satisfies MemoryDeclarationLine,
			context
		);

		expect(getTestMemoryMap(context)).toMatchSnapshot();
	});
});
