import { ErrorCode, getError } from '../errors';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { isInstructionInsideModuleOrFunction, saveByteCode } from '../utils';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const abs: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideModuleOrFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (operand.isInteger) {
		// For some reason there is still no abs instruction for integers in Web Assembly.
		context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });
		const valueName = '__absify_value' + line.lineNumber;

		return compileSegment(
			[
				`local int ${valueName}`,
				`localSet ${valueName}`,
				`localGet ${valueName}`,
				'push 0',
				'lessThan',
				'if',
				' push 0',
				` localGet ${valueName}`,
				' sub',
				'else',
				` localGet ${valueName}`,
				'ifEnd',
			],
			context
		);
	} else {
		context.stack.push({ isInteger: false, isNonZero: operand.isNonZero });
		return saveByteCode(context, [WASMInstruction.F32_ABS]);
	}
};

export default abs;
