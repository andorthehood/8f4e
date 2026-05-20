import { ArgumentType } from '@8f4e/compiler-spec';

import { SyntaxErrorCode, SyntaxRulesError } from './syntaxError';
import parseLiteralMulDivExpression from './parseLiteralMulDivExpression';
import parseNumericLiteralToken, {
	isNumericLikeInvalidToken,
	startsWithNumericPrefix,
} from './parseNumericLiteralToken';
import parseConstantMulDivExpression from './parseConstantMulDivExpression';

import type { Argument, ArgumentIdentifier, ArgumentLiteral } from '@8f4e/compiler-spec';

function classifySimpleIdentifier(value: string): ArgumentIdentifier {
	return {
		type: ArgumentType.IDENTIFIER,
		value,
		referenceKind: isConstantIdentifierName(value) ? 'constant' : 'plain',
		scope: 'local',
	};
}

function isConstantIdentifierName(value: string): boolean {
	if (value.length === 0 || !isUppercaseAsciiLetter(value.charCodeAt(0))) {
		return false;
	}

	for (let index = 1; index < value.length; index++) {
		if (isLowercaseAsciiLetter(value.charCodeAt(index))) {
			return false;
		}
	}

	return true;
}

function isUppercaseAsciiLetter(charCode: number): boolean {
	return charCode >= 65 && charCode <= 90;
}

function isLowercaseAsciiLetter(charCode: number): boolean {
	return charCode >= 97 && charCode <= 122;
}

function classifyIntermodularReference(value: string): ArgumentIdentifier | null {
	if (value.startsWith('&')) {
		return classifyStartAddressIntermodularReference(value);
	}

	if (value.endsWith('&')) {
		return classifyEndAddressIntermodularReference(value);
	}

	return null;
}

function classifyStartAddressIntermodularReference(value: string): ArgumentIdentifier | null {
	const colonIndex = value.indexOf(':', 1);
	if (colonIndex === -1 || value.indexOf(':', colonIndex + 1) !== -1) {
		return null;
	}

	const targetModuleId = value.slice(1, colonIndex);
	if (!isValidModuleReferenceName(targetModuleId)) {
		return null;
	}

	const targetMemoryId = value.slice(colonIndex + 1);
	if (targetMemoryId.length === 0) {
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-module-reference',
			scope: 'intermodule',
			targetModuleId,
			isEndAddress: false,
		};
	}

	if (isDecimalDigits(targetMemoryId)) {
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-module-nth-reference',
			scope: 'intermodule',
			targetModuleId,
			targetMemoryIndex: Number.parseInt(targetMemoryId, 10),
		};
	}

	if (!isValidModuleReferenceName(targetMemoryId)) {
		return null;
	}

	return {
		type: ArgumentType.IDENTIFIER,
		value,
		referenceKind: 'intermodular-reference',
		scope: 'intermodule',
		targetModuleId,
		targetMemoryId,
		isEndAddress: false,
	};
}

function classifyEndAddressIntermodularReference(value: string): ArgumentIdentifier | null {
	const colonIndex = value.indexOf(':');
	if (colonIndex === -1 || value.indexOf(':', colonIndex + 1) !== -1) {
		return null;
	}

	const targetModuleId = value.slice(0, colonIndex);
	if (!isValidModuleReferenceName(targetModuleId)) {
		return null;
	}

	const targetMemoryId = value.slice(colonIndex + 1, -1);
	if (targetMemoryId.length === 0) {
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-module-reference',
			scope: 'intermodule',
			targetModuleId,
			isEndAddress: true,
		};
	}

	if (!isValidModuleReferenceName(targetMemoryId)) {
		return null;
	}

	return {
		type: ArgumentType.IDENTIFIER,
		value,
		referenceKind: 'intermodular-reference',
		scope: 'intermodule',
		targetModuleId,
		targetMemoryId,
		isEndAddress: true,
	};
}

function isValidModuleReferenceName(value: string): boolean {
	if (value.length === 0) {
		return false;
	}

	for (let index = 0; index < value.length; index++) {
		const char = value[index];
		if (char === '&' || char === ':' || char === '.' || char.trim() === '') {
			return false;
		}
	}

	return true;
}

function isDecimalDigits(value: string): boolean {
	if (value.length === 0) {
		return false;
	}

	for (let index = 0; index < value.length; index++) {
		const charCode = value.charCodeAt(index);
		if (charCode < 48 || charCode > 57) {
			return false;
		}
	}

	return true;
}

function classifyElementQuery(value: string): ArgumentIdentifier | null {
	switch (value[0]) {
		case 'c':
			return classifyCountQuery(value);
		case 's':
			return classifyWordSizeQuery(value);
		case 'm':
			if (value.startsWith('max(')) {
				return classifyMaxQuery(value);
			}
			return classifyMinQuery(value);
		default:
			return null;
	}
}

function classifyCountQuery(value: string): ArgumentIdentifier | null {
	const targetMemoryId = extractQueryInner(value, 'count(');
	if (targetMemoryId === null) {
		return null;
	}

	const intermodule = parseIntermodularElementQuery(targetMemoryId);
	if (intermodule) {
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-element-count',
			scope: 'intermodule',
			targetModuleId: intermodule.targetModuleId,
			targetMemoryId: intermodule.targetMemoryId,
		};
	}

	return {
		type: ArgumentType.IDENTIFIER,
		value,
		referenceKind: 'element-count',
		scope: 'local',
		targetMemoryId,
	};
}

function classifyWordSizeQuery(value: string): ArgumentIdentifier | null {
	const targetMemoryId = extractQueryInner(value, 'sizeof(');
	if (targetMemoryId === null) {
		return null;
	}

	const intermodule = parseIntermodularElementQuery(targetMemoryId);
	if (intermodule) {
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-element-word-size',
			scope: 'intermodule',
			targetModuleId: intermodule.targetModuleId,
			targetMemoryId: intermodule.targetMemoryId,
		};
	}

	if (targetMemoryId.startsWith('*')) {
		const pointeeTargetMemoryId = getPointeeQueryTarget(value, targetMemoryId);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'pointee-element-word-size',
			scope: 'local',
			targetMemoryId: pointeeTargetMemoryId,
			isPointee: true,
		};
	}

	return {
		type: ArgumentType.IDENTIFIER,
		value,
		referenceKind: 'element-word-size',
		scope: 'local',
		targetMemoryId,
	};
}

function classifyMaxQuery(value: string): ArgumentIdentifier | null {
	const targetMemoryId = extractQueryInner(value, 'max(');
	if (targetMemoryId === null) {
		return null;
	}

	const intermodule = parseIntermodularElementQuery(targetMemoryId);
	if (intermodule) {
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-element-max',
			scope: 'intermodule',
			targetModuleId: intermodule.targetModuleId,
			targetMemoryId: intermodule.targetMemoryId,
		};
	}

	if (targetMemoryId.startsWith('*')) {
		const pointeeTargetMemoryId = getPointeeQueryTarget(value, targetMemoryId);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'pointee-element-max',
			scope: 'local',
			targetMemoryId: pointeeTargetMemoryId,
			isPointee: true,
		};
	}

	return {
		type: ArgumentType.IDENTIFIER,
		value,
		referenceKind: 'element-max',
		scope: 'local',
		targetMemoryId,
	};
}

function classifyMinQuery(value: string): ArgumentIdentifier | null {
	const targetMemoryId = extractQueryInner(value, 'min(');
	if (targetMemoryId === null) {
		return null;
	}

	const intermodule = parseIntermodularElementQuery(targetMemoryId);
	if (intermodule) {
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-element-min',
			scope: 'intermodule',
			targetModuleId: intermodule.targetModuleId,
			targetMemoryId: intermodule.targetMemoryId,
		};
	}

	return {
		type: ArgumentType.IDENTIFIER,
		value,
		referenceKind: 'element-min',
		scope: 'local',
		targetMemoryId,
	};
}

function extractQueryInner(value: string, prefix: string): string | null {
	if (!value.startsWith(prefix) || !value.endsWith(')')) {
		return null;
	}

	const inner = value.slice(prefix.length, -1);
	if (inner.trim().length === 0) {
		throw new SyntaxRulesError(SyntaxErrorCode.INVALID_IDENTIFIER, `Metadata query target is missing: ${value}`);
	}

	return inner;
}

function getPointeeQueryTarget(value: string, targetMemoryId: string): string {
	const pointeeTargetMemoryId = targetMemoryId.slice(1);
	if (pointeeTargetMemoryId.trim().length === 0) {
		throw new SyntaxRulesError(
			SyntaxErrorCode.INVALID_IDENTIFIER,
			`Pointee metadata query target is missing: ${value}`
		);
	}

	return pointeeTargetMemoryId;
}

function parseIntermodularElementQuery(value: string): { targetModuleId: string; targetMemoryId: string } | null {
	const colonIndex = value.indexOf(':');
	if (colonIndex === -1 || value.indexOf(':', colonIndex + 1) !== -1) {
		return null;
	}

	const targetModuleId = value.slice(0, colonIndex);
	const targetMemoryId = value.slice(colonIndex + 1);
	if (!isValidElementReferenceName(targetModuleId) || !isValidElementReferenceName(targetMemoryId)) {
		return null;
	}

	return { targetModuleId, targetMemoryId };
}

function isValidElementReferenceName(value: string): boolean {
	if (value.length === 0) {
		return false;
	}

	for (let index = 0; index < value.length; index++) {
		const char = value[index];
		if (char === ':' || char === '(' || char === ')' || char.trim() === '') {
			return false;
		}
	}

	return true;
}

/**
 * Decodes escape sequences in a raw (unquoted) string literal body.
 * Supported: \", \\, \n, \r, \t, \xNN.
 */
export function decodeStringLiteral(raw: string): string {
	let result = '';
	let i = 0;
	while (i < raw.length) {
		if (raw[i] === '\\') {
			if (i + 1 >= raw.length) {
				throw new SyntaxRulesError(SyntaxErrorCode.INVALID_STRING_LITERAL, `Unexpected end of string after backslash`);
			}
			const next = raw[i + 1];
			switch (next) {
				case '"':
					result += '"';
					i += 2;
					break;
				case '\\':
					result += '\\';
					i += 2;
					break;
				case 'n':
					result += '\n';
					i += 2;
					break;
				case 'r':
					result += '\r';
					i += 2;
					break;
				case 't':
					result += '\t';
					i += 2;
					break;
				case 'x': {
					const hex = raw.slice(i + 2, i + 4);
					if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
						throw new SyntaxRulesError(
							SyntaxErrorCode.INVALID_STRING_LITERAL,
							`Invalid hex escape sequence: \\x${hex}`
						);
					}
					result += String.fromCharCode(parseInt(hex, 16));
					i += 4;
					break;
				}
				default:
					throw new SyntaxRulesError(SyntaxErrorCode.INVALID_STRING_LITERAL, `Unknown escape sequence: \\${next}`);
			}
		} else {
			result += raw[i];
			i++;
		}
	}
	return result;
}

/**
 * Classifies an identifier string into a structured `ArgumentIdentifier` with reference metadata.
 * Classification is based purely on token shape; no semantic resolution is performed.
 *
 * Required check order (earlier checks must precede later ones):
 *  1. intermodular-module-reference  (&mod: / mod:&)     — before intermodular-reference,
 *     because &mod: starts with & like local memory refs and the module-base form must win.
 *  2. intermodular-module-nth-reference (&mod:0)          — before intermodular-reference,
 *     because digits are valid [^\s&:.] chars so &mod:0 would silently match the named-memory regex.
 *  3. intermodular-reference (&mod:mem / mod:mem&)        — before memory-reference,
 *     because both start/end with & and the intermodular form must win.
 *  4. intermodular element-query forms (count/sizeof/…)   — before local element-query forms,
 *     because their pattern (e.g. count(mod:mem)) is a superset of the local form (count(name)).
 *  5. memory-reference (&name / name&)                    — after all intermodular forms.
 *  6. pointee element-query forms                         — before plain element-query forms,
 *     because sizeof(*name) also starts with sizeof( and max(*name) also starts with max(.
 */
export function classifyIdentifier(value: string): ArgumentIdentifier {
	const firstChar = value[0];
	const lastChar = value[value.length - 1];
	const hasIntermoduleSeparator = value.includes(':');
	const hasMemoryReferenceSigil = firstChar === '&' || lastChar === '&';
	const hasPointerPrefix = firstChar === '*';
	const hasQueryOpen = value.includes('(');

	// This classifier sits in the compilation hot path, so the dispatch below is intentionally
	// micro-optimized to avoid calling every shape helper for plain identifier-like tokens.
	if (!hasIntermoduleSeparator && !hasMemoryReferenceSigil && !hasPointerPrefix && !hasQueryOpen) {
		return classifySimpleIdentifier(value);
	}

	// Intermodular module-base and memory references must be checked before local memory references.
	if (hasIntermoduleSeparator) {
		const intermodularReference = classifyIntermodularReference(value);
		if (intermodularReference) {
			return intermodularReference;
		}
	}

	// Metadata query parsing keeps intermodular forms ahead of local and pointee forms.
	if (hasQueryOpen) {
		const elementQuery = classifyElementQuery(value);
		if (elementQuery) {
			return elementQuery;
		}
	}

	// Local memory reference: &name (start) or name& (end).
	// Checked after all intermodular forms since &mod: and &mod:mem also start with &.
	if (hasMemoryReferenceSigil) {
		const isEndAddress = lastChar === '&';
		const targetMemoryId = firstChar === '&' ? value.substring(1) : value.slice(0, -1);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'memory-reference',
			scope: 'local',
			targetMemoryId,
			isEndAddress,
		};
	}

	// Memory pointer: *name
	if (hasPointerPrefix) {
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'memory-pointer',
			scope: 'local',
			targetMemoryId: value.substring(1),
		};
	}

	return classifySimpleIdentifier(value);
}

/**
 * Parses a single compile-time expression operand (left-hand or right-hand side).
 * Operands can be numeric literals or identifier-shaped tokens; they are never
 * themselves expressions because the grammar only allows a single operator.
 */
export function parseCompileTimeOperand(operand: string): ArgumentLiteral | ArgumentIdentifier {
	const numericLiteral = parseNumericLiteralToken(operand);
	if (numericLiteral) {
		return {
			value: numericLiteral.value,
			type: ArgumentType.LITERAL,
			isInteger: numericLiteral.isInteger,
			...(numericLiteral.isFloat64 && { isFloat64: true }),
			...(numericLiteral.isHex && { isHex: true }),
		};
	}
	return classifyIdentifier(operand);
}

/**
 * Parses a single argument from an instruction line.
 * Recognizes numeric literals (decimal, hex, binary, fractions), quoted string literals, and identifiers.
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
