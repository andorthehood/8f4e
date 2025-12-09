import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { isInstructionInsideModuleOrFunction, saveByteCode } from '../utils';
import { localGet } from '../wasmUtils/instructionHelpers';

import type { InstructionCompiler } from '../types';

const _localGet: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideModuleOrFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		const local = context.namespace.locals[line.arguments[0].value];

		if (!local) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
		}

		context.stack.push({ isInteger: local.isInteger, isNonZero: false });

		return saveByteCode(context, localGet(local.index));
	} else {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}
};

export default _localGet;
