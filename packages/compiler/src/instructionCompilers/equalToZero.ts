import { ErrorCode, getError } from '../errors';
import type { InstructionCompiler } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { isInstructionIsInsideAModule, saveByteCode } from '../utils';
import { compileSegment } from '../compiler';

const equalToZero: InstructionCompiler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (operand.isInteger) {
		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [WASMInstruction.I32_EQZ]);
	} else {
		context.stack.push(operand);
		return compileSegment(['push 0.0', 'equal'], context);
	}
};

export default equalToZero;
