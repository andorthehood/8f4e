import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { br } from '../wasmUtils/instructionHelpers';
import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

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
