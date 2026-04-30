import { WASMInstruction, br } from '@8f4e/compiler-wasm-utils';
import { BLOCK_TYPE } from '@8f4e/compiler-types';

import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '@8f4e/compiler-types';

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
