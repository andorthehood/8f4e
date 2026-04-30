import { ErrorCode, getError } from '../../compilerError';

import type { CallLine, CompilationContext } from '@8f4e/compiler-types';

/**
 * Semantic normalizer for the `call` instruction.
 * Validates that the call target function name exists in the function registry
 * before codegen runs. This is the semantic ownership boundary for function
 * existence validation; codegen only handles stack shape, parameter/return
 * type compatibility, and lowering.
 */
export default function normalizeCall(line: CallLine, context: CompilationContext): CallLine {
	if (!context.namespace.functions) {
		return line;
	}

	const functionId = line.arguments[0].value;
	if (!context.namespace.functions[functionId]) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context);
	}

	return line;
}
