import { describe, expect, it } from 'vitest';

import { validateOperandTypes } from './validateOperandTypes';

import { ErrorCode } from '../compilerError';

import type { CompilationContext, InstructionCompiler } from '../types';

const line: Parameters<InstructionCompiler>[0] = {
	lineNumberBeforeMacroExpansion: 1,
	lineNumberAfterMacroExpansion: 1,
	instruction: 'test' as never,
	arguments: [],
};
const context = { stack: [] } as unknown as CompilationContext;

describe('validateOperandTypes', () => {
	it('accepts valid scalar rules', () => {
		expect(() => validateOperandTypes([{ isInteger: true }, { isInteger: true }], 'int', line, context)).not.toThrow();
		expect(() =>
			validateOperandTypes([{ isInteger: false }, { isInteger: false }], 'float', line, context)
		).not.toThrow();
	});

	it('rejects invalid scalar rules', () => {
		expect(() => validateOperandTypes([{ isInteger: true }, { isInteger: false }], 'matching', line, context)).toThrow(
			`${ErrorCode.UNMATCHING_OPERANDS}`
		);
	});

	it('validates tuple rules by position', () => {
		expect(() =>
			validateOperandTypes([{ isInteger: true }, { isInteger: false }], ['int', 'float'], line, context)
		).not.toThrow();
		expect(() =>
			validateOperandTypes([{ isInteger: false }, { isInteger: false }], ['int', 'float'], line, context)
		).toThrow(`${ErrorCode.TYPE_MISMATCH}`);
	});
});
