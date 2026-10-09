import type { CompilerASTLine } from '@8f4e/language-spec';
import { BlockType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { compileInstructionForTest } from '../testUtils';
import _return from './return';

describe('return instruction compiler', () => {
	it('emits WASM return opcode', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,
					expectedResultTypes: [],
				},
			],
		});

		compileInstructionForTest(
			_return,
			{
				lineNumber: 1,
				instruction: 'return',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
