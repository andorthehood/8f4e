import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { isInstructionInsideModuleOrFunction, saveByteCode } from '../utils';

import type { InstructionCompiler } from '../types';

const _if: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideModuleOrFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (!operand.isInteger) {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}

	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.CONDITION,
		});
		return saveByteCode(context, [WASMInstruction.IF, Type.VOID]);
	}

	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'float') {
		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: true,
			blockType: BLOCK_TYPE.CONDITION,
		});
		return saveByteCode(context, [WASMInstruction.IF, Type.F32]);
	}

	context.blockStack.push({
		expectedResultIsInteger: true,
		hasExpectedResult: true,
		blockType: BLOCK_TYPE.CONDITION,
	});
	return saveByteCode(context, [WASMInstruction.IF, Type.I32]);
};

export default _if;
