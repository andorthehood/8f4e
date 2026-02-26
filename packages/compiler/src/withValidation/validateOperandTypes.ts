import { inferErrorCodeFromRule } from './inferErrorCodeFromRule';

import { ErrorCode, getError } from '../errors';
import { areAllOperandsFloats, areAllOperandsIntegers } from '../utils/operandTypes';

import type { CompilationContext, InstructionCompiler, StackItem } from '../types';
import type { OperandRule } from './types';

export function validateOperandTypes(
	operands: StackItem[],
	rule: OperandRule | OperandRule[],
	line: Parameters<InstructionCompiler>[0],
	context: CompilationContext
): void {
	const errorCode = inferErrorCodeFromRule(rule);

	if (Array.isArray(rule)) {
		for (let i = 0; i < rule.length && i < operands.length; i++) {
			const operand = operands[i];
			const expectedType = rule[i];

			if (expectedType === 'int' && !operand.isInteger) {
				throw getError(errorCode, line, context);
			} else if (expectedType === 'float' && operand.isInteger) {
				throw getError(errorCode, line, context);
			}
		}
	} else if (rule === 'int') {
		if (!areAllOperandsIntegers(...operands)) {
			throw getError(errorCode, line, context);
		}
	} else if (rule === 'float') {
		if (!areAllOperandsFloats(...operands)) {
			throw getError(errorCode, line, context);
		}
	} else if (rule === 'matching') {
		if (!areAllOperandsIntegers(...operands) && !areAllOperandsFloats(...operands)) {
			throw getError(errorCode, line, context);
		}
	}
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const line: Parameters<InstructionCompiler>[0] = {
		lineNumber: 1,
		instruction: 'test' as never,
		arguments: [],
	};
	const context = { stack: [] } as unknown as CompilationContext;

	describe('validateOperandTypes', () => {
		it('accepts valid scalar rules', () => {
			expect(() =>
				validateOperandTypes([{ isInteger: true }, { isInteger: true }], 'int', line, context)
			).not.toThrow();
			expect(() =>
				validateOperandTypes([{ isInteger: false }, { isInteger: false }], 'float', line, context)
			).not.toThrow();
		});

		it('rejects invalid scalar rules', () => {
			expect(() =>
				validateOperandTypes([{ isInteger: true }, { isInteger: false }], 'matching', line, context)
			).toThrow(`${ErrorCode.UNMATCHING_OPERANDS}`);
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
}
