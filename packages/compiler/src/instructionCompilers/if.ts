import { Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { BLOCK_TYPE } from '../types';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, IfLine, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `if`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const _if: InstructionCompiler<IfLine> = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation confirmed 1 operand exists before this function was called
		context.stack.pop()!;

		if (line.ifBlock?.resultType === 'float') {
			context.blockStack.push({
				expectedResultIsInteger: false,
				hasExpectedResult: true,
				blockType: BLOCK_TYPE.CONDITION,
			});
			return saveByteCode(context, [WASMInstruction.IF, Type.F32]);
		}

		if (line.ifBlock?.resultType === 'int') {
			context.blockStack.push({
				expectedResultIsInteger: true,
				hasExpectedResult: true,
				blockType: BLOCK_TYPE.CONDITION,
			});
			return saveByteCode(context, [WASMInstruction.IF, Type.I32]);
		}

		// No declared result type on the matching ifEnd means no block result.
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

	describe('if instruction compiler', () => {
		it('emits a void if block when the matching ifEnd declares no result', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			_if(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'if',
					arguments: [],
					ifBlock: { matchingIfEndIndex: 2, resultType: null, hasElse: false },
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
					ifBlock: { matchingIfEndIndex: 2, resultType: null, hasElse: false },
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
					arguments: [],
					ifBlock: { matchingIfEndIndex: 2, resultType: 'float', hasElse: false },
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
					arguments: [],
					ifBlock: { matchingIfEndIndex: 2, resultType: 'int', hasElse: false },
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
