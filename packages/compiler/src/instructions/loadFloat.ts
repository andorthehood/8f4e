import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers, isInstructionIsInsideAModule } from '../utils';
import { InstructionHandler } from '../types';
import { f32load } from '../wasmUtils/instructionHelpers';
import { parseSegment } from '../compiler';

const loadFloat: InstructionHandler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsIntegers(operand)) {
		if (operand.isSafeMemoryAddress) {
			context.stack.push({ isInteger: false, isNonZero: false });
			return { byteCode: f32load(), context };
		} else {
			context.stack.push(operand);
			const tempVariableName = '__loadAddress_temp_' + line.lineNumber;
			// Memory overflow protection.
			const ret = parseSegment(
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
			context.stack.pop();
			context.stack.push({ isInteger: false, isNonZero: false });
			return ret;
		}
	} else {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}
};

export default loadFloat;
