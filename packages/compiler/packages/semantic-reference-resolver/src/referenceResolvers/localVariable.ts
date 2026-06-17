import {
	type CompilationContext,
	ErrorCode,
	getError,
	type LocalSetLine,
	type ResolvedLocalSetLine,
} from '@8f4e/language-spec';

/**
 * Validates that localSet targets an already-declared local.
 * This keeps local existence checks in semantic reference resolution instead of the dispatcher/codegen layers.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns localSet line with resolved local metadata.
 */
export default function resolveLocalVariableAccess(
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
