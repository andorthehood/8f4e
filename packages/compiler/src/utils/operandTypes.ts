import type { StackItem } from '../types';

export function areAllOperandsIntegers(...operands: StackItem[]): boolean {
	return !operands.some(operand => !operand.isInteger);
}

export function areAllOperandsFloats(...operands: StackItem[]): boolean {
	return !operands.some(operand => operand.isInteger);
}

export function areAllOperandsFloat64(...operands: StackItem[]): boolean {
	return operands.length > 0 && operands.every(operand => !operand.isInteger && operand.isFloat64 === true);
}

export function hasMixedFloatWidth(...operands: StackItem[]): boolean {
	const floats = operands.filter(op => !op.isInteger);
	return floats.some(op => op.isFloat64) && floats.some(op => !op.isFloat64);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('operandTypes utilities', () => {
		const intOperand: StackItem = { isInteger: true, isNonZero: false };
		const floatOperand: StackItem = { isInteger: false, isNonZero: false };
		const float64Operand: StackItem = { isInteger: false, isFloat64: true, isNonZero: false };

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

		describe('areAllOperandsFloat64', () => {
			it('returns true when all operands are float64', () => {
				expect(areAllOperandsFloat64(float64Operand, float64Operand)).toBe(true);
				expect(areAllOperandsFloat64(float64Operand)).toBe(true);
			});

			it('returns false when operands are float32', () => {
				expect(areAllOperandsFloat64(floatOperand, floatOperand)).toBe(false);
				expect(areAllOperandsFloat64(floatOperand)).toBe(false);
			});

			it('returns false when operands are mixed float32/float64', () => {
				expect(areAllOperandsFloat64(floatOperand, float64Operand)).toBe(false);
			});

			it('returns false when operands are integers', () => {
				expect(areAllOperandsFloat64(intOperand)).toBe(false);
			});

			it('returns false for empty operands', () => {
				expect(areAllOperandsFloat64()).toBe(false);
			});
		});

		describe('hasMixedFloatWidth', () => {
			it('returns true when one operand is float32 and another is float64', () => {
				expect(hasMixedFloatWidth(floatOperand, float64Operand)).toBe(true);
				expect(hasMixedFloatWidth(float64Operand, floatOperand)).toBe(true);
			});

			it('returns false when all operands are float32', () => {
				expect(hasMixedFloatWidth(floatOperand, floatOperand)).toBe(false);
			});

			it('returns false when all operands are float64', () => {
				expect(hasMixedFloatWidth(float64Operand, float64Operand)).toBe(false);
			});

			it('returns false when all operands are integers', () => {
				expect(hasMixedFloatWidth(intOperand, intOperand)).toBe(false);
			});

			it('returns false for single float operand', () => {
				expect(hasMixedFloatWidth(floatOperand)).toBe(false);
				expect(hasMixedFloatWidth(float64Operand)).toBe(false);
			});
		});
	});
}
