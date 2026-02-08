import { ArgumentType, BLOCK_TYPE } from '../types';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';
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

		if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
			context.blockStack.push({
				expectedResultIsInteger: false,
				hasExpectedResult: false,
				blockType: BLOCK_TYPE.CONDITION,
			});
			return saveByteCode(context, [WASMInstruction.IF, Type.VOID]);
		}

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

		context.blockStack.push({
			expectedResultIsInteger: true,
			hasExpectedResult: true,
			blockType: BLOCK_TYPE.CONDITION,
		});
		return saveByteCode(context, [WASMInstruction.IF, Type.I32]);
	}
);

export default _if;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('if instruction compiler', () => {
		it('emits a void if block', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			_if(
				{
					lineNumber: 1,
					instruction: 'if',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'void' }],
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
					lineNumber: 1,
					instruction: 'if',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'float' }],
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
