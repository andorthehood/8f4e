import { classifyIdentifier } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';

import { ErrorCode, getError } from './compilerError';
import { type AST } from './types';

describe('getError', () => {
	it('includes the undeclared identifier when provided', () => {
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('missingLocal')],
		} as AST[number];

		const error = getError(ErrorCode.UNDECLARED_IDENTIFIER, line, undefined, { identifier: 'missingLocal' });

		expect(error.message).toBe(`Undeclared identifier: missingLocal. (${ErrorCode.UNDECLARED_IDENTIFIER})`);
	});

	it('keeps the generic undeclared identifier message when no identifier is available', () => {
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'use',
			arguments: [],
			isSemanticOnly: true,
		} as AST[number];

		const error = getError(ErrorCode.UNDECLARED_IDENTIFIER, line);

		expect(error.message).toBe(`Undeclared identifier. (${ErrorCode.UNDECLARED_IDENTIFIER})`);
	});

	it('includes the duplicate identifier when provided', () => {
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'module',
			arguments: [classifyIdentifier('same')],
			isSemanticOnly: true,
		} as AST[number];

		const error = getError(ErrorCode.DUPLICATE_IDENTIFIER, line, undefined, { identifier: 'same' });

		expect(error.message).toBe(
			`Duplicate identifier: same. Module and function IDs must be unique. (${ErrorCode.DUPLICATE_IDENTIFIER})`
		);
	});

	it('includes the missing #follow target module when provided', () => {
		const line = {
			lineNumberBeforeMacroExpansion: 2,
			lineNumberAfterMacroExpansion: 2,
			instruction: '#follow',
			arguments: [classifyIdentifier('missing')],
			isSemanticOnly: true,
		} as AST[number];

		const error = getError(ErrorCode.MODULE_FOLLOW_TARGET_NOT_FOUND, line, undefined, { identifier: 'missing' });

		expect(error.message).toBe(
			`#follow target module was not found: missing. (${ErrorCode.MODULE_FOLLOW_TARGET_NOT_FOUND})`
		);
	});
});
