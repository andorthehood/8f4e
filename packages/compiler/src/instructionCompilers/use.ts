import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `use`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const use: InstructionCompiler = function (line, context) {
	if (line.arguments[0].type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	const namespaceToUse = context.namespace.namespaces[line.arguments[0].value];

	if (!namespaceToUse) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
	}

	context.namespace.consts = { ...context.namespace.consts, ...namespaceToUse.consts };

	return context;
};

export default use;
