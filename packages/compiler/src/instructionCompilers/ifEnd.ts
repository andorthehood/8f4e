import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `ifEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const ifEnd: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		const block = context.blockStack.pop();

		if (!block || block.blockType !== BLOCK_TYPE.CONDITION) {
			throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
		}

		if (block.hasExpectedResult) {
			const operand = context.stack.pop();

			if (!operand) {
				throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
			}

			if (block.expectedResultIsInteger && !operand.isInteger) {
				throw getError(ErrorCode.ONLY_INTEGERS, line, context);
			}

			if (!block.expectedResultIsInteger && operand.isInteger) {
				throw getError(ErrorCode.ONLY_FLOATS, line, context);
			}

			context.stack.push(operand);
		}

		return saveByteCode(context, [WASMInstruction.END]);
	}
);

export default ifEnd;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('ifEnd instruction compiler', () => {
		it('ends a conditional block with result', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					...createInstructionCompilerTestContext().blockStack,
					{
						blockType: BLOCK_TYPE.CONDITION,
						expectedResultIsInteger: true,
						hasExpectedResult: true,
					},
				],
			});
			context.stack.push({ isInteger: true, isNonZero: false });

			ifEnd({ lineNumber: 1, instruction: 'ifEnd', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				blockStack: context.blockStack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('throws when missing condition block', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				ifEnd({ lineNumber: 1, instruction: 'ifEnd', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
