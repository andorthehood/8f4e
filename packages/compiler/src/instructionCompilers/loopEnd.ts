import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import br from '../wasmUtils/controlFlow/br';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `loopEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const loopEnd: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		const block = context.blockStack.pop();

		if (!block || block.blockType !== BLOCK_TYPE.LOOP) {
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

		return saveByteCode(context, [...br(0), WASMInstruction.END, WASMInstruction.END]);
	}
);

export default loopEnd;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('loopEnd instruction compiler', () => {
		it('ends a loop block', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					...createInstructionCompilerTestContext().blockStack,
					{
						blockType: BLOCK_TYPE.LOOP,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
			});

			loopEnd({ lineNumber: 1, instruction: 'loopEnd', arguments: [] } as AST[number], context);

			expect({
				blockStack: context.blockStack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('throws when missing loop block', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				loopEnd({ lineNumber: 1, instruction: 'loopEnd', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
