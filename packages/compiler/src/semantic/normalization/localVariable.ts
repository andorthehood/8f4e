import { type CompilationContext, ErrorCode, type LocalSetLine, type ResolvedLocalSetLine } from '@8f4e/compiler-spec';

import { getError } from '../../compilerError';

/**
 * Validates that localSet targets an already-declared local.
 * This keeps local existence checks in semantic normalization instead of the dispatcher/codegen layers.
 */
export default function normalizeLocalVariableAccess(
	line: LocalSetLine,
	context: CompilationContext
): ResolvedLocalSetLine {
	const nameArg = line.arguments[0];
	const local = context.locals[nameArg.value];
	if (!local) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: nameArg.value });
	}

	return { ...line, local };
}
