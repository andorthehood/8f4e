import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { saveByteCode } from '../utils';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `wasm`.
 * @see [Instruction docs](../../docs/instructions/low-level.md)
 */
const wasm: InstructionCompiler = function (line, context) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type !== ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	return saveByteCode(context, [line.arguments[0].value]);
};

export default wasm;
