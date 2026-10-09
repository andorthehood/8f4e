import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { compileInstructionForTest } from '../testUtils';
import shiftRightUnsigned from './shiftRightUnsigned';

describe('shiftRightUnsigned instruction compiler', () => {
	it('emits I32_SHR_U for integer operands', () => {
		const context = createInstructionCompilerTestContext();

		compileInstructionForTest(
			shiftRightUnsigned,
			{
				lineNumber: 1,
				instruction: 'shiftRightUnsigned',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
