import type { MemoryDeclarationLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext from '../../utils/testUtils';
import int from './int';
import { applyPlannedMemoryDeclaration, getTestMemoryMap } from './testUtils';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('int instruction compiler', () => {
	it('creates an int memory entry', () => {
		const context = createInstructionCompilerTestContext();

		applyPlannedMemoryDeclaration(
			int,
			{
				lineNumber: 1,
				instruction: 'int',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('counter')],
			} satisfies MemoryDeclarationLine,
			context
		);

		expect(getTestMemoryMap(context)).toMatchSnapshot();
	});
});
