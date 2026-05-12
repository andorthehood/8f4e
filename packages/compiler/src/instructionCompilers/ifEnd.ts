import { WASMInstruction } from '@8f4e/compiler-wasm-utils';
import { BLOCK_TYPE } from '@8f4e/compiler-spec';

import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `ifEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const ifEnd: InstructionCompiler = (line, context) => {
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
};

export default ifEnd;
