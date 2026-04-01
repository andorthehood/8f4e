import { BLOCK_TYPE } from '../types';

import { Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, BlockLine, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `block`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const block: InstructionCompiler<BlockLine> = withValidation<BlockLine>(
	{
		scope: 'moduleOrFunction',
	},
	(line: BlockLine, context) => {
		const resultType = line.arguments[0].value;

		if (resultType === 'float') {
			context.blockStack.push({
				expectedResultIsInteger: false,
				hasExpectedResult: true,
				blockType: BLOCK_TYPE.BLOCK,
			});
			return saveByteCode(context, [WASMInstruction.BLOCK, Type.F32]);
		}

		if (resultType === 'int') {
			context.blockStack.push({
				expectedResultIsInteger: true,
				hasExpectedResult: true,
				blockType: BLOCK_TYPE.BLOCK,
			});
			return saveByteCode(context, [WASMInstruction.BLOCK, Type.I32]);
		}

		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.BLOCK,
		});

		return saveByteCode(context, [WASMInstruction.BLOCK, Type.VOID]);
	}
);

export default block;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('block instruction compiler', () => {
		it('emits a typed block for float', () => {
			const context = createInstructionCompilerTestContext();

			block(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'block',
					arguments: [classifyIdentifier('float')],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('emits a typed block for int', () => {
			const context = createInstructionCompilerTestContext();

			block(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'block',
					arguments: [classifyIdentifier('int')],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('emits a void block for unknown type', () => {
			const context = createInstructionCompilerTestContext();

			block(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'block',
					arguments: [classifyIdentifier('void')],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
