import type { CodegenContext, CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { ErrorCode, getError } from '@8f4e/compiler-spec';

/**
 * Throws when a function attempts memory IO without the `#impure` directive.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
export default function assertFunctionMemoryIoAllowed(
	line: CompilerASTLine,
	context: CodegenContext | CompilationContext
): void {
	if (context.mode === 'function' && !context.currentFunctionIsImpure) {
		throw getError(ErrorCode.IMPURE_DIRECTIVE_REQUIRED_FOR_MEMORY_IO, line, context);
	}
}
