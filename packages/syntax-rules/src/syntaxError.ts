export enum SyntaxErrorCode {
	INVALID_MEMORY_IDENTIFIER_PREFIX = 'INVALID_MEMORY_IDENTIFIER_PREFIX',
	INVALID_POINTER_DEPTH = 'INVALID_POINTER_DEPTH',
	MISSING_ARGUMENT = 'MISSING_ARGUMENT',
}

export class SyntaxRulesError extends Error {
	constructor(
		public code: SyntaxErrorCode,
		message: string,
		public details?: Record<string, unknown>
	) {
		super(message);
		this.name = 'SyntaxRulesError';
	}
}
