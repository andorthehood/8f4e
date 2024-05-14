import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers, isInstructionIsInsideAModule } from '../utils';
import { InstructionHandler } from '../types';
import { f32load } from '../wasmUtils/instructionHelpers';
import { parseSegment } from '../compiler';

const loadFloat: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsIntegers(operand)) {
		context.stack.push({ isInteger: false, isNonZero: false });

		if (operand.isSafeMemoryAddress) {
			return { byteCode: f32load(), context };
		} else {
			const tempVariableName = '__loadAddress_temp_' + line.lineNumber;
			// Memory overflow protection.
			return parseSegment(
				[
					`local int ${tempVariableName}`,
					`localSet ${tempVariableName}`,
					`localGet ${tempVariableName}`,
					`push ${context.memoryByteSize - 1}`,
					'greaterThan',
					'if int',
					`push 0`,
					'else',
					`localGet ${tempVariableName}`,
					'ifEnd',
					...f32load().map(wasmInstruction => {
						return `wasm ${wasmInstruction}`;
					}),
				],
				context
			);
		}
	} else {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}
};

export default loadFloat;
