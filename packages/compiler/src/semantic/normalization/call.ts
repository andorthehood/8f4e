import type { CallLine, CompilationContext, ResolvedCallLine } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';

/**
 * Semantic normalizer for the `call` instruction.
 * Validates that the call target function name exists in the function registry
 * before codegen runs. This is the semantic ownership boundary for function
 * existence validation; codegen only handles stack shape, parameter/return
 * type compatibility, and lowering.
 */
export default function normalizeCall(line: CallLine, context: CompilationContext): CallLine | ResolvedCallLine {
	if (!context.namespace.functions) {
		return line;
	}

	const functionId = line.arguments[0].value;
	const targetFunction = context.namespace.functions[functionId];
	if (!targetFunction) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context);
	}

	return { ...line, targetFunction };
}
