import type { CompilationContext, CompilerASTLine, LocalSetLine, Stack } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
import { consume } from './stack';

/**
 * Consumes the assigned value and checks it against the resolved local binding type.
 *
 * @param line - Compiler line being processed.
 * @param context - Current compiler context consulted or updated by the operation.
 * @returns The stack items produced or consumed by the operation.
 */
export function analyzeLocalSet(
	line: CompilerASTLine,
	context: CompilationContext
): { consumed: Stack; produced: Stack } {
	const consumed = consume(context, 1);
	const operand = consumed[0];
	const { local } = line as LocalSetLine & {
		local: CompilationContext['locals'][string];
	};

	if (local.isInteger && operand.valueType !== 'int') {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}

	if (!local.isInteger && operand.valueType === 'int') {
		throw getError(ErrorCode.ONLY_FLOATS, line, context);
	}

	return { consumed, produced: [] };
}
