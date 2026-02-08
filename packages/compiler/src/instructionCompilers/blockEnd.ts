import { ErrorCode, getError } from '../errors';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { BLOCK_TYPE } from '../types';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `blockEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const blockEnd: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		const block = context.blockStack.pop();

		if (!block) {
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

			context.stack.push(operand);
		}

		context.byteCode.push(...[WASMInstruction.END]);
		return context;
	}
);

export default blockEnd;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('blockEnd instruction compiler', () => {
		it('restores expected result on the stack', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					...createInstructionCompilerTestContext().blockStack,
					{
						blockType: BLOCK_TYPE.BLOCK,
						expectedResultIsInteger: true,
						hasExpectedResult: true,
					},
				],
			});
			context.stack.push({ isInteger: true, isNonZero: false });

			blockEnd({ lineNumber: 1, instruction: 'blockEnd', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
