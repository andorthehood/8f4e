import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { compileInstructionForTest } from '../testUtils';
import drop from './drop';

describe('drop instruction compiler', () => {
	it('drops the top stack value', () => {
		const context = createInstructionCompilerTestContext();

		compileInstructionForTest(
			drop,
			{
				lineNumber: 1,
				instruction: 'drop',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
