import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `else`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const _else: InstructionCompiler = withValidation(
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

			if (!block.expectedResultIsInteger && operand.isInteger) {
				throw getError(ErrorCode.ONLY_FLOATS, line, context);
			}
		}

		context.blockStack.push(block);

		return saveByteCode(context, [WASMInstruction.ELSE]);
	}
);

export default _else;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('else instruction compiler', () => {
		it('emits else bytecode and restores block', () => {
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

			_else({ lineNumber: 1, instruction: 'else', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				blockStack: context.blockStack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('throws when no matching block start exists', () => {
			const context = createInstructionCompilerTestContext({ blockStack: [] });

			expect(() => {
				_else({ lineNumber: 1, instruction: 'else', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
