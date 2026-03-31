/**
 * Syntax errors — raised when source structure is invalid before semantic analysis.
 *
 * Use this module for errors that can be detected from token or argument shape alone,
 * without requiring symbol resolution, scope validation, stack state, type checking,
 * or any other compiler state:
 *   - malformed literal syntax (e.g. division by zero in a literal fraction)
 *   - missing required argument shape
 *   - invalid declaration shape
 *   - invalid pointer-depth syntax
 *   - malformed prefix/suffix syntax
 *   - invalid string literal encoding
 *
 * Boundary rule:
 *   If the error can be detected before building semantic context → it belongs here.
 *   If detecting it requires symbol resolution, scope, stack state, or type knowledge
 *   → use ErrorCode / getError in compilerError.ts.
 */

export enum SyntaxErrorCode {
	INVALID_MEMORY_IDENTIFIER_PREFIX = 'INVALID_MEMORY_IDENTIFIER_PREFIX',
	INVALID_IDENTIFIER = 'INVALID_IDENTIFIER',
	INVALID_ARGUMENT = 'INVALID_ARGUMENT',
	INVALID_NUMERIC_LITERAL = 'INVALID_NUMERIC_LITERAL',
	INVALID_POINTER_DEPTH = 'INVALID_POINTER_DEPTH',
	MISSING_ARGUMENT = 'MISSING_ARGUMENT',
	DIVISION_BY_ZERO = 'DIVISION_BY_ZERO',
	INVALID_STRING_LITERAL = 'INVALID_STRING_LITERAL',
	SPLIT_HEX_MIXED_TOKENS = 'SPLIT_HEX_MIXED_TOKENS',
}

/**
 * Default messages for each syntax error code.
 * Throw sites that do not need a custom message can omit the message argument
 * and this registry will supply the default.
 */
const SyntaxErrorMessages: Record<SyntaxErrorCode, string> = {
	[SyntaxErrorCode.INVALID_MEMORY_IDENTIFIER_PREFIX]: 'Invalid memory identifier prefix.',
	[SyntaxErrorCode.INVALID_IDENTIFIER]: 'Invalid identifier.',
	[SyntaxErrorCode.INVALID_ARGUMENT]: 'Invalid instruction argument.',
	[SyntaxErrorCode.INVALID_NUMERIC_LITERAL]: 'Invalid numeric literal or expression.',
	[SyntaxErrorCode.INVALID_POINTER_DEPTH]: 'Invalid pointer depth.',
	[SyntaxErrorCode.MISSING_ARGUMENT]: 'Missing required argument.',
	[SyntaxErrorCode.DIVISION_BY_ZERO]: 'Division by zero in literal expression.',
	[SyntaxErrorCode.INVALID_STRING_LITERAL]: 'Invalid string literal.',
	[SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS]:
		'Split-byte default values must consist entirely of byte-resolving tokens: integer literals (0–255), literal-only * or / expressions that fold to an integer in that range, or constant-style identifiers. Memory references and non-byte-resolving forms are not allowed in split-byte sequences.',
};

export class SyntaxRulesError extends Error {
	constructor(
		public code: SyntaxErrorCode,
		message?: string,
		public details?: Record<string, unknown>
	) {
		super(message ?? SyntaxErrorMessages[code]);
		this.name = 'SyntaxRulesError';
	}
}
