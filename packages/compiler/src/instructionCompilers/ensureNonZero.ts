import { isInstructionInsideModuleOrFunction } from '../utils';
import { ErrorCode } from '../errors';
import { ArgumentType } from '../types';
import { getError } from '../errors';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const div: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideModuleOrFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	context.stack.push(operand);

	let defaultNonZeroValue = operand.isInteger ? '1' : '1.0';

	// If the operand is float we convert the argument to a float string.
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.LITERAL && !operand.isInteger) {
		defaultNonZeroValue = line.arguments[0].value.toFixed(1);
	}

	// If the operand is integer we convert the argument to an integer string.
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.LITERAL && operand.isInteger) {
		defaultNonZeroValue = line.arguments[0].value.toString();
	}

	const tempVariableName = '__ensureNonZero_temp_' + line.lineNumber;

	if (operand.isInteger) {
		const ret = compileSegment(
			[
				`local int ${tempVariableName}`,
				`localSet ${tempVariableName}`,
				`localGet ${tempVariableName}`,
				'equalToZero',
				'if int',
				`push ${defaultNonZeroValue}`,
				'else',
				`localGet ${tempVariableName}`,
				'ifEnd',
			],
			context
		);
		context.stack.pop();
		context.stack.push({ isInteger: true, isNonZero: true });
		return ret;
	} else {
		const ret = compileSegment(
			[
				`local float ${tempVariableName}`,
				`localSet ${tempVariableName}`,
				`localGet ${tempVariableName}`,
				'equalToZero',
				'if float',
				`push ${defaultNonZeroValue}`,
				'else',
				`localGet ${tempVariableName}`,
				'ifEnd',
			],
			context
		);
		context.stack.pop();
		context.stack.push({ isInteger: false, isNonZero: true });
		return ret;
	}
};

export default div;
