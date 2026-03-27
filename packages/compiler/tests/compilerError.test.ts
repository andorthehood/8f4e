import { describe, expect, it } from 'vitest';

import { ErrorCode, getError } from '../src/compilerError';
import { ArgumentType, type AST } from '../src/types';

describe('getError', () => {
	it('includes the undeclared identifier when provided', () => {
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'localGet',
			arguments: [{ type: ArgumentType.IDENTIFIER, value: 'missingLocal' }],
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
});
