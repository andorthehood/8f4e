import type { InstructionCompiler } from '../types';
import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { isInstructionIsInsideAModule } from '../utils';

const _const: InstructionCompiler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	if (!line.arguments[0] || !line.arguments[1]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	let value = { value: 0, isInteger: true };

	if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
		if (typeof context.namespace.consts[line.arguments[1].value] !== 'undefined') {
			value = context.namespace.consts[line.arguments[1].value];
		} else {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
		}
	} else {
		value = line.arguments[1];
	}

	context.namespace.consts[line.arguments[0].value] = value;

	return context;
};

export default _const;
