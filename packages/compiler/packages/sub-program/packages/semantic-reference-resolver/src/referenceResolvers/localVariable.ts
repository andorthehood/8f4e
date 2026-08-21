import { type CompilationContext, ErrorCode, getError, type LocalSetLine } from '@8f4e/language-spec';

/**
 * Validates that localSet targets an already-declared local.
 * This keeps local existence checks in semantic reference resolution instead of the dispatcher/codegen layers.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns localSet line with resolved local metadata.
 */
export default function resolveLocalVariableAccess(line: LocalSetLine, context: CompilationContext): LocalSetLine {
	const nameArg = line.arguments[0];
	if (!context.locals[nameArg.value]) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: nameArg.value });
	}

	return line;
}
