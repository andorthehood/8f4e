import { ArgumentType, type AST, type Argument } from '@8f4e/tokenizer';

import { ErrorCode, getError } from '../../compilerError';

import type { CompilationContext } from '../../types';

export function validateOrDeferCompileTimeExpression(
	argument: Extract<Argument, { type: ArgumentType.COMPILE_TIME_EXPRESSION }>,
	line: AST[number],
	context: CompilationContext
): false {
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context as never, {
		identifier: `${argument.left.value}${argument.operator}${argument.right.value}`,
	});
}

export function validateOrDeferUnresolvedIdentifier(
	argument: Extract<Argument, { type: ArgumentType.IDENTIFIER }>,
	line: AST[number],
	context: CompilationContext
): false {
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context as never, { identifier: argument.value });
}
