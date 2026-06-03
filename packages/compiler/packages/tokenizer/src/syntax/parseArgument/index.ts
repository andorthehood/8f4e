import type { Argument } from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';
import parseConstantMulDivExpression from '../parseConstantMulDivExpression';
import parseLiteralMulDivExpression from '../parseLiteralMulDivExpression';
import parseNumericLiteralToken, {
	isNumericLikeInvalidToken,
	startsWithNumericPrefix,
} from '../parseNumericLiteralToken';
import { SyntaxErrorCode, SyntaxRulesError } from '../syntaxError';
import { classifyIdentifier } from './classifyIdentifier';
import { decodeStringLiteral } from './decodeStringLiteral';
import { parseCompileTimeOperand } from './parseCompileTimeOperand';

export { classifyIdentifier } from './classifyIdentifier';
export { decodeStringLiteral } from './decodeStringLiteral';
export { parseCompileTimeOperand } from './parseCompileTimeOperand';

/**
 * Parses a single argument from an instruction line.
 * Recognizes numeric literals, quoted string literals, compile-time expressions, and identifiers.
 *
 * @param argument - The argument string to parse.
 * @returns Parsed argument with type information.
 */
export function parseArgument(argument: string): Argument {
	// Try to fold literal-only mul/div expressions (handles *, /, and integer/integer fractions)
	const mulDivResult = parseLiteralMulDivExpression(argument);
	if (mulDivResult !== null) {
		return {
			type: ArgumentType.LITERAL,
			value: mulDivResult.value,
			isInteger: mulDivResult.isInteger,
			...(mulDivResult.isFloat64 && { isFloat64: true }),
		};
	}

	switch (true) {
		// Check for quoted string literals
		case argument.startsWith('"') && argument.endsWith('"') && argument.length >= 2: {
			const raw = argument.slice(1, -1);
			return {
				type: ArgumentType.STRING_LITERAL,
				value: decodeStringLiteral(raw),
			};
		}
		default: {
			const numericLiteral = parseNumericLiteralToken(argument);
			if (numericLiteral) {
				return {
					value: numericLiteral.value,
					type: ArgumentType.LITERAL,
					isInteger: numericLiteral.isInteger,
					...(numericLiteral.isFloat64 && { isFloat64: true }),
					...(numericLiteral.isHex && { isHex: true }),
				};
			}

			const compileTimeExpression = parseConstantMulDivExpression(argument);
			if (compileTimeExpression !== null) {
				const left = parseCompileTimeOperand(compileTimeExpression.lhs);
				const right = parseCompileTimeOperand(compileTimeExpression.rhs);
				const intermoduleIds: string[] = [];
				for (const operand of [left, right]) {
					if (operand.type === ArgumentType.IDENTIFIER && operand.scope === 'intermodule' && operand.targetModuleId) {
						intermoduleIds.push(operand.targetModuleId);
					}
				}
				return {
					type: ArgumentType.COMPILE_TIME_EXPRESSION,
					left,
					operator: compileTimeExpression.operator,
					right,
					intermoduleIds,
				};
			}

			// Reject numeric-looking tokens that failed literal parsing so they do not silently
			// become identifiers. This keeps standalone and compound numeric syntax boundaries clear.
			if (isNumericLikeInvalidToken(argument)) {
				throw new SyntaxRulesError(
					SyntaxErrorCode.INVALID_NUMERIC_LITERAL,
					`Invalid numeric literal or expression: ${argument}`
				);
			}
			if (startsWithNumericPrefix(argument)) {
				throw new SyntaxRulesError(
					SyntaxErrorCode.INVALID_IDENTIFIER,
					`Identifiers cannot start with numbers: ${argument}`
				);
			}
			return classifyIdentifier(argument);
		}
	}
}
