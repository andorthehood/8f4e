import { describe, it, expect } from 'vitest';

import { SyntaxRulesError, SyntaxErrorCode } from '../src/syntaxError';

describe('SyntaxRulesError', () => {
	it('creates error with code and message', () => {
		const error = new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT, 'Argument is required');

		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(SyntaxRulesError);
		expect(error.code).toBe(SyntaxErrorCode.MISSING_ARGUMENT);
		expect(error.message).toBe('Argument is required');
		expect(error.name).toBe('SyntaxRulesError');
	});

	it('supports optional details', () => {
		const error = new SyntaxRulesError(SyntaxErrorCode.INVALID_MEMORY_IDENTIFIER_PREFIX, 'Invalid prefix', {
			identifier: 'test',
			prefix: '#',
		});

		expect(error.details).toEqual({ identifier: 'test', prefix: '#' });
	});

	it('works without details', () => {
		const error = new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT, 'Argument is required');

		expect(error.details).toBeUndefined();
	});
});
