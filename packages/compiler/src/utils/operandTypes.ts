import type { StackItem } from '../types';

export function areAllOperandsIntegers(...operands: StackItem[]): boolean {
	return !operands.some(operand => !operand.isInteger);
}

export function areAllOperandsFloats(...operands: StackItem[]): boolean {
	return !operands.some(operand => operand.isInteger);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('operandTypes utilities', () => {
		const intOperand: StackItem = { isInteger: true, isNonZero: false };
		const floatOperand: StackItem = { isInteger: false, isNonZero: false };

		describe('areAllOperandsIntegers', () => {
			it('returns true when all operands are integers', () => {
				expect(areAllOperandsIntegers(intOperand, intOperand)).toBe(true);
				expect(areAllOperandsIntegers(intOperand)).toBe(true);
			});

			it('returns false when at least one operand is float', () => {
				expect(areAllOperandsIntegers(intOperand, floatOperand)).toBe(false);
				expect(areAllOperandsIntegers(floatOperand)).toBe(false);
			});

			it('returns true for empty operands', () => {
				expect(areAllOperandsIntegers()).toBe(true);
			});
		});

		describe('areAllOperandsFloats', () => {
			it('returns true when all operands are floats', () => {
				expect(areAllOperandsFloats(floatOperand, floatOperand)).toBe(true);
				expect(areAllOperandsFloats(floatOperand)).toBe(true);
			});

			it('returns false when at least one operand is integer', () => {
				expect(areAllOperandsFloats(floatOperand, intOperand)).toBe(false);
				expect(areAllOperandsFloats(intOperand)).toBe(false);
			});

			it('returns true for empty operands', () => {
				expect(areAllOperandsFloats()).toBe(true);
			});
		});
	});
}
