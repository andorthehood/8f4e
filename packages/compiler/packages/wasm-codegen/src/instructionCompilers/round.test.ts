import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { compileInstructionForTest } from '../testUtils';
import round from './round';

describe('round instruction compiler', () => {
	it('rounds a float operand', () => {
		const context = createInstructionCompilerTestContext();

		compileInstructionForTest(
			round,
			{
				lineNumber: 1,
				instruction: 'round',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
