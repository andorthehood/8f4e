import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';

import type { InstructionCompiler } from '../types';

// Note: This instruction does not use withValidation because it defines a module scope
// rather than operating within one. The withValidation helper is designed for instructions
// that must be inside a specific scope, not for instructions that create new scopes.
const _module: InstructionCompiler = function (line, context) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.MODULE,
	});

	context.namespace.moduleName = line.arguments[0].value;

	return context;
};

export default _module;
