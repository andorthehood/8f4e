import { ArgumentType, type AST, type CompilationContext } from '../../types';
import { ErrorCode, getError } from '../../compilerError';

/**
 * Validates that localGet/localSet target an already-declared local.
 * This keeps local existence checks in semantic normalization instead of the dispatcher/codegen layers.
 */
export default function normalizeLocalVariableAccess(line: AST[number], context: CompilationContext): AST[number] {
	const nameArg = line.arguments[0];
	if (nameArg?.type === ArgumentType.IDENTIFIER && !context.locals[nameArg.value]) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: nameArg.value });
	}

	return line;
}
