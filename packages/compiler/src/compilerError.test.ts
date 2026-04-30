import { classifyIdentifier } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';
import { type AST } from '@8f4e/compiler-types';

import { ErrorCode, getError } from './compilerError';

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
});
