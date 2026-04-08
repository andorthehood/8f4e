import { Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { ArgumentType, BLOCK_TYPE } from '../types';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `if`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const _if: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation confirmed 1 operand exists before this function was called
		context.stack.pop()!;

		if (
			line.arguments[0] &&
			line.arguments[0].type === ArgumentType.IDENTIFIER &&
			line.arguments[0].value === 'float'
		) {
			context.blockStack.push({
				expectedResultIsInteger: false,
				hasExpectedResult: true,
				blockType: BLOCK_TYPE.CONDITION,
			});
			return saveByteCode(context, [WASMInstruction.IF, Type.F32]);
		}

		if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'int') {
			context.blockStack.push({
				expectedResultIsInteger: true,
				hasExpectedResult: true,
				blockType: BLOCK_TYPE.CONDITION,
			});
			return saveByteCode(context, [WASMInstruction.IF, Type.I32]);
		}

		// No argument or 'void' — no result
		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.CONDITION,
		});
		return saveByteCode(context, [WASMInstruction.IF, Type.VOID]);
	}
);

export default _if;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('if instruction compiler', () => {
		it('emits a void if block when given a void argument', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			_if(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'if',
					arguments: [classifyIdentifier('void')],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('emits a void if block when given no arguments', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			_if(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'if',
					arguments: [],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('emits a float if block', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			_if(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'if',
					arguments: [classifyIdentifier('float')],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('emits an int if block', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			_if(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'if',
					arguments: [classifyIdentifier('int')],
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
