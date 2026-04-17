import { SyntaxErrorCode, SyntaxRulesError } from './syntaxError';
import parseLiteralMulDivExpression from './parseLiteralMulDivExpression';
import parseNumericLiteralToken, {
	isNumericLikeInvalidToken,
	startsWithNumericPrefix,
} from './parseNumericLiteralToken';
import parseConstantMulDivExpression from './parseConstantMulDivExpression';
import isIntermodularModuleReference from './isIntermodularModuleReference';
import extractIntermodularModuleReferenceBase from './extractIntermodularModuleReferenceBase';
import isIntermodularModuleNthReference from './isIntermodularModuleNthReference';
import extractIntermodularModuleNthReferenceBase from './extractIntermodularModuleNthReferenceBase';
import isIntermodularReference from './isIntermodularReference';
import isIntermodularElementCountReference from './isIntermodularElementCountReference';
import extractIntermodularElementCountBase from './extractIntermodularElementCountBase';
import isIntermodularElementWordSizeReference from './isIntermodularElementWordSizeReference';
import extractIntermodularElementWordSizeBase from './extractIntermodularElementWordSizeBase';
import isIntermodularElementMaxReference from './isIntermodularElementMaxReference';
import extractIntermodularElementMaxBase from './extractIntermodularElementMaxBase';
import isIntermodularElementMinReference from './isIntermodularElementMinReference';
import extractIntermodularElementMinBase from './extractIntermodularElementMinBase';
import hasMemoryReferencePrefix from './hasMemoryReferencePrefix';
import extractMemoryReferenceBase from './extractMemoryReferenceBase';
import isMemoryPointerIdentifier from './isMemoryPointerIdentifier';
import extractMemoryPointerBase from './extractMemoryPointerBase';
import hasPointeeElementWordSizePrefix from './hasPointeeElementWordSizePrefix';
import extractPointeeElementWordSizeBase from './extractPointeeElementWordSizeBase';
import hasPointeeElementMaxPrefix from './hasPointeeElementMaxPrefix';
import extractPointeeElementMaxBase from './extractPointeeElementMaxBase';
import hasElementCountPrefix from './hasElementCountPrefix';
import extractElementCountBase from './extractElementCountBase';
import hasElementWordSizePrefix from './hasElementWordSizePrefix';
import extractElementWordSizeBase from './extractElementWordSizeBase';
import hasElementMaxPrefix from './hasElementMaxPrefix';
import extractElementMaxBase from './extractElementMaxBase';
import hasElementMinPrefix from './hasElementMinPrefix';
import extractElementMinBase from './extractElementMinBase';
import isConstantName from './isConstantName';

export enum ArgumentType {
	LITERAL = 'literal',
	IDENTIFIER = 'identifier',
	STRING_LITERAL = 'string_literal',
	COMPILE_TIME_EXPRESSION = 'compile_time_expression',
}

/**
 * The syntactic class of an identifier-shaped argument.
 * Computed from token shape alone by the tokenizer; no semantic resolution is needed.
 */
export type ReferenceKind =
	| 'plain'
	| 'constant'
	| 'memory-pointer'
	| 'memory-reference'
	| 'element-count'
	| 'element-word-size'
	| 'element-max'
	| 'element-min'
	| 'pointee-element-word-size'
	| 'pointee-element-max'
	| 'intermodular-reference'
	| 'intermodular-module-reference'
	| 'intermodular-module-nth-reference'
	| 'intermodular-element-count'
	| 'intermodular-element-word-size'
	| 'intermodular-element-max'
	| 'intermodular-element-min';

export type ArgumentLiteral = {
	type: ArgumentType.LITERAL;
	value: number;
	isInteger: boolean;
	isFloat64?: boolean;
	isHex?: boolean;
};
type IdentifierBase<K extends ReferenceKind, S extends 'local' | 'intermodule'> = {
	type: ArgumentType.IDENTIFIER;
	value: string;
	referenceKind: K;
	scope: S;
};

type PlainIdentifier = IdentifierBase<'plain', 'local'>;
type ConstantIdentifier = IdentifierBase<'constant', 'local'>;
type MemoryPointerIdentifier = IdentifierBase<'memory-pointer', 'local'> & {
	targetMemoryId: string;
};
type MemoryReferenceIdentifier = IdentifierBase<'memory-reference', 'local'> & {
	targetMemoryId: string;
	isEndAddress: boolean;
};
type ElementCountIdentifier = IdentifierBase<'element-count', 'local'> & {
	targetMemoryId: string;
};
type ElementWordSizeIdentifier = IdentifierBase<'element-word-size', 'local'> & { targetMemoryId: string };
type ElementMaxIdentifier = IdentifierBase<'element-max', 'local'> & {
	targetMemoryId: string;
};
type ElementMinIdentifier = IdentifierBase<'element-min', 'local'> & {
	targetMemoryId: string;
};
type PointeeElementWordSizeIdentifier = IdentifierBase<'pointee-element-word-size', 'local'> & {
	targetMemoryId: string;
	isPointee: true;
};
type PointeeElementMaxIdentifier = IdentifierBase<'pointee-element-max', 'local'> & {
	targetMemoryId: string;
	isPointee: true;
};
type IntermodularReferenceIdentifier = IdentifierBase<'intermodular-reference', 'intermodule'> & {
	targetModuleId: string;
	targetMemoryId: string;
	isEndAddress: boolean;
};
type IntermodularModuleReferenceIdentifier = IdentifierBase<'intermodular-module-reference', 'intermodule'> & {
	targetModuleId: string;
	isEndAddress: boolean;
};
type IntermodularModuleNthReferenceIdentifier = IdentifierBase<'intermodular-module-nth-reference', 'intermodule'> & {
	targetModuleId: string;
	targetMemoryIndex: number;
};
type IntermodularElementCountIdentifier = IdentifierBase<'intermodular-element-count', 'intermodule'> & {
	targetModuleId: string;
	targetMemoryId: string;
};
type IntermodularElementWordSizeIdentifier = IdentifierBase<'intermodular-element-word-size', 'intermodule'> & {
	targetModuleId: string;
	targetMemoryId: string;
};
type IntermodularElementMaxIdentifier = IdentifierBase<'intermodular-element-max', 'intermodule'> & {
	targetModuleId: string;
	targetMemoryId: string;
};
type IntermodularElementMinIdentifier = IdentifierBase<'intermodular-element-min', 'intermodule'> & {
	targetModuleId: string;
	targetMemoryId: string;
};

export type ArgumentIdentifier =
	| PlainIdentifier
	| ConstantIdentifier
	| MemoryPointerIdentifier
	| MemoryReferenceIdentifier
	| ElementCountIdentifier
	| ElementWordSizeIdentifier
	| ElementMaxIdentifier
	| ElementMinIdentifier
	| PointeeElementWordSizeIdentifier
	| PointeeElementMaxIdentifier
	| IntermodularReferenceIdentifier
	| IntermodularModuleReferenceIdentifier
	| IntermodularModuleNthReferenceIdentifier
	| IntermodularElementCountIdentifier
	| IntermodularElementWordSizeIdentifier
	| IntermodularElementMaxIdentifier
	| IntermodularElementMinIdentifier;
export type ArgumentStringLiteral = {
	type: ArgumentType.STRING_LITERAL;
	value: string;
};
/**
 * A fully parsed compile-time expression operand.
 * Operands are either numeric literals or classified identifier nodes;
 * they are never nested expressions because the grammar only allows a single operator.
 */
export type CompileTimeOperand = ArgumentLiteral | ArgumentIdentifier;
export type ArgumentCompileTimeExpression = {
	type: ArgumentType.COMPILE_TIME_EXPRESSION;
	left: CompileTimeOperand;
	operator: '*' | '/';
	right: CompileTimeOperand;
	/**
	 * Module IDs referenced by intermodular operands in this expression.
	 * Pre-computed by the tokenizer so that compiler consumers (module sort, namespace
	 * collection, intermodule deferral) can read this field directly instead of
	 * inspecting each operand's type and referenceKind themselves.
	 */
	intermoduleIds: ReadonlyArray<string>;
};

export type Argument = ArgumentLiteral | ArgumentIdentifier | ArgumentStringLiteral | ArgumentCompileTimeExpression;

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
	// Intermodular module-base references must be checked before generic memory-reference
	// because &mod: and mod:& both start with & or end with & like local memory refs.
	if (isIntermodularModuleReference(value)) {
		const { module: targetModuleId, isEndAddress } = extractIntermodularModuleReferenceBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-module-reference',
			scope: 'intermodule',
			targetModuleId,
			isEndAddress,
		};
	}

	// Intermodular module nth-item references: &mod:0, &mod:1, etc.
	// Checked before generic intermodular-reference to prevent numeric suffixes from being
	// treated as named memory identifiers.
	if (isIntermodularModuleNthReference(value)) {
		const { module: targetModuleId, index: targetMemoryIndex } = extractIntermodularModuleNthReferenceBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-module-nth-reference',
			scope: 'intermodule',
			targetModuleId,
			targetMemoryIndex,
		};
	}

	// Intermodular memory references: &mod:mem or mod:mem&
	if (isIntermodularReference(value)) {
		const isEndAddress = value.endsWith('&');
		const cleanRef = isEndAddress ? value.slice(0, -1) : value.slice(1);
		const colonIdx = cleanRef.indexOf(':');
		const targetModuleId = cleanRef.slice(0, colonIdx);
		const targetMemoryId = cleanRef.slice(colonIdx + 1);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-reference',
			scope: 'intermodule',
			targetModuleId,
			targetMemoryId,
			isEndAddress,
		};
	}

	// Intermodular element queries must be checked before local element queries
	// because their pattern (e.g. count(mod:mem)) is a superset of local (count(name)).
	if (isIntermodularElementCountReference(value)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementCountBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-element-count',
			scope: 'intermodule',
			targetModuleId,
			targetMemoryId,
		};
	}

	if (isIntermodularElementWordSizeReference(value)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementWordSizeBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-element-word-size',
			scope: 'intermodule',
			targetModuleId,
			targetMemoryId,
		};
	}

	if (isIntermodularElementMaxReference(value)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementMaxBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-element-max',
			scope: 'intermodule',
			targetModuleId,
			targetMemoryId,
		};
	}

	if (isIntermodularElementMinReference(value)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementMinBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'intermodular-element-min',
			scope: 'intermodule',
			targetModuleId,
			targetMemoryId,
		};
	}

	// Local memory reference: &name (start) or name& (end).
	// Checked after all intermodular forms since &mod: and &mod:mem also start with &.
	if (hasMemoryReferencePrefix(value)) {
		const targetMemoryId = extractMemoryReferenceBase(value);
		const isEndAddress = value.endsWith('&');
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
	if (isMemoryPointerIdentifier(value)) {
		const targetMemoryId = extractMemoryPointerBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'memory-pointer',
			scope: 'local',
			targetMemoryId,
		};
	}

	// Pointee forms must be checked before plain element-query forms
	// because sizeof(*name) also starts with sizeof( and max(*name) also starts with max(.
	if (hasPointeeElementWordSizePrefix(value)) {
		const targetMemoryId = extractPointeeElementWordSizeBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'pointee-element-word-size',
			scope: 'local',
			targetMemoryId,
			isPointee: true,
		};
	}

	if (hasPointeeElementMaxPrefix(value)) {
		const targetMemoryId = extractPointeeElementMaxBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'pointee-element-max',
			scope: 'local',
			targetMemoryId,
			isPointee: true,
		};
	}

	// Local element-query forms
	if (hasElementCountPrefix(value)) {
		const targetMemoryId = extractElementCountBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'element-count',
			scope: 'local',
			targetMemoryId,
		};
	}

	if (hasElementWordSizePrefix(value)) {
		const targetMemoryId = extractElementWordSizeBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'element-word-size',
			scope: 'local',
			targetMemoryId,
		};
	}

	if (hasElementMaxPrefix(value)) {
		const targetMemoryId = extractElementMaxBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'element-max',
			scope: 'local',
			targetMemoryId,
		};
	}

	if (hasElementMinPrefix(value)) {
		const targetMemoryId = extractElementMinBase(value);
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'element-min',
			scope: 'local',
			targetMemoryId,
		};
	}

	// Constant-style name: starts with uppercase, contains no lowercase letters
	if (isConstantName(value)) {
		return {
			type: ArgumentType.IDENTIFIER,
			value,
			referenceKind: 'constant',
			scope: 'local',
		};
	}

	// Plain identifier
	return {
		type: ArgumentType.IDENTIFIER,
		value,
		referenceKind: 'plain',
		scope: 'local',
	};
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
