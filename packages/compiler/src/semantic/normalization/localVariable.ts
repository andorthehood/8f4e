import { type CompilationContext, type ParsedLocalVariableAccessLine } from '@8f4e/compiler-types';

import { ErrorCode, getError } from '../../compilerError';

/**
 * Validates that localSet targets an already-declared local.
 * This keeps local existence checks in semantic normalization instead of the dispatcher/codegen layers.
 */
export default function normalizeLocalVariableAccess(
	line: ParsedLocalVariableAccessLine,
	context: CompilationContext
): ParsedLocalVariableAccessLine {
	const nameArg = line.arguments[0];
	if (!context.locals[nameArg.value]) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: nameArg.value });
	}

	return line;
}
