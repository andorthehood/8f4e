import type { CompilationContext, CompilerASTLine, Stack } from '@8f4e/language-spec';
import { ErrorCode, getError } from '@8f4e/language-spec';
import { consume } from './stack';

/**
 * Consumes the assigned value and checks it against the resolved local binding type.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The relevant stack items for the analysis step.
 */
export function analyzeLocalSet(
	line: CompilerASTLine,
	context: CompilationContext
): { consumed: Stack; produced: Stack } {
	const consumed = consume(context, 1);
	const operand = consumed[0];
	const localName = (line.arguments[0] as { value: string }).value;
	const local = context.locals[localName]!;

	if (local.isInteger && operand.valueType !== 'int') {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}

	if (!local.isInteger && operand.valueType === 'int') {
		throw getError(ErrorCode.ONLY_FLOATS, line, context);
	}

	return { consumed, produced: [] };
}
