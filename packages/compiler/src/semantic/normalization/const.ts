import { ArgumentType, type CompilationContext, type ConstLine, type NormalizedConstLine } from '@8f4e/compiler-types';

import { normalizeArgumentsAtIndexes } from './helpers';

import { ErrorCode, getError } from '../../compilerError';

// Throws UNDECLARED_IDENTIFIER when the value cannot be folded to a literal.
// During namespace prepass, collectNamespacesFromASTs catches this to defer the AST
// until the referenced identifiers are available.
export default function normalizeConst(line: ConstLine, context: CompilationContext): NormalizedConstLine {
	const { line: result } = normalizeArgumentsAtIndexes(line, context, [1]);

	const valueArg = result.arguments[1];
	if (valueArg.type !== ArgumentType.LITERAL) {
		const identifier =
			valueArg.type === ArgumentType.COMPILE_TIME_EXPRESSION
				? `${valueArg.left.value}${valueArg.operator}${valueArg.right.value}`
				: String(valueArg.value);
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier });
	}

	return result as NormalizedConstLine;
}
