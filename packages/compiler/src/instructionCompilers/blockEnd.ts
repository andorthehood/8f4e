import { ErrorCode, getError } from '../errors';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import { createInstructionCompilerTestContext } from '../utils/testUtils';
import { BLOCK_TYPE } from '../types';

import type { AST, InstructionCompiler, Error } from '../types';

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

		return saveByteCode(context, [WASMInstruction.END]);
	}
);

export default blockEnd;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('blockEnd instruction compiler', () => {
		it('throws when no matching block start exists', () => {
			const context = createInstructionCompilerTestContext();
			let error: Error | undefined;

			try {
				blockEnd({ lineNumber: 1, instruction: 'blockEnd', arguments: [] } as AST[number], context);
			} catch (caught) {
				error = caught as Error;
			}

			expect({ code: error?.code, message: error?.message }).toMatchSnapshot();
		});

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
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
