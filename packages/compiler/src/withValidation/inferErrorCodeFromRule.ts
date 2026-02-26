import { ErrorCode, type ErrorCode as ErrorCodeType } from '../errors';

import type { OperandRule } from './types';

export function inferErrorCodeFromRule(rule: OperandRule | OperandRule[]): ErrorCodeType {
	if (Array.isArray(rule)) {
		return ErrorCode.TYPE_MISMATCH;
	} else if (rule === 'int') {
		return ErrorCode.ONLY_INTEGERS;
	} else if (rule === 'float') {
		return ErrorCode.ONLY_FLOATS;
	} else if (rule === 'matching') {
		return ErrorCode.UNMATCHING_OPERANDS;
	}
	throw new Error(`Unexpected operand rule: ${rule}`);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('inferErrorCodeFromRule', () => {
		it('returns the correct error code for scalar rules', () => {
			expect(inferErrorCodeFromRule('int')).toBe(ErrorCode.ONLY_INTEGERS);
			expect(inferErrorCodeFromRule('float')).toBe(ErrorCode.ONLY_FLOATS);
			expect(inferErrorCodeFromRule('matching')).toBe(ErrorCode.UNMATCHING_OPERANDS);
		});

		it('returns TYPE_MISMATCH for tuple rules', () => {
			expect(inferErrorCodeFromRule(['int', 'float'])).toBe(ErrorCode.TYPE_MISMATCH);
		});
	});
}
