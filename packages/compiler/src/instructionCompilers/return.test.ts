import type { CompilerASTLine } from '@8f4e/language-spec';
import { BlockType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import _return from './return';

describe('return instruction compiler', () => {
	it('emits WASM return opcode and clears the stack', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,
					expectedResultTypes: [],
				},
			],
		});
		context.stack.push({ kind: 'value', valueType: 'float', isNonZero: false });

		analyzeAndCompileInstruction(
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
			stack: context.stack,
		}).toMatchSnapshot();
	});
});
