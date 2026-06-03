import {
	ArgumentType,
	type CompilationContext,
	type ConstLine,
	ErrorCode,
	type NormalizedConstLine,
} from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
import { normalizeArgumentsAtIndexes } from './helpers';

// Throws UNDECLARED_IDENTIFIER when the value cannot be folded to a literal.
// During namespace discovery, collectNamespacesFromASTs catches this to defer the AST
// until the referenced identifiers are available.
/** Normalizes and requires the value argument for a `const` line to fold to a literal. */
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
