import type { StackItem } from '../types';

export function isPowerOfTwo(value: number): boolean {
	return value > 0 && (value & (value - 1)) === 0;
}

export function log2(value: number): number {
	let result = 0;
	let temp = value;
	while (temp > 1) {
		temp >>= 1;
		result++;
	}
	return result;
}

export function canOptimizeMulToPowerOfTwo(operand1: StackItem, operand2: StackItem): number | null {
	if (operand2.constantValue !== undefined && operand2.isInteger && isPowerOfTwo(operand2.constantValue)) {
		return log2(operand2.constantValue);
	}
	if (operand1.constantValue !== undefined && operand1.isInteger && isPowerOfTwo(operand1.constantValue)) {
		return log2(operand1.constantValue);
	}
	return null;
}

export function canOptimizeDivToPowerOfTwo(divisor: StackItem): number | null {
	if (divisor.constantValue !== undefined && divisor.isInteger && isPowerOfTwo(divisor.constantValue)) {
		return log2(divisor.constantValue);
	}
	return null;
}

export function isIdentityMultiplication(operand1: StackItem, operand2: StackItem): boolean {
	return (operand1.constantValue === 1 && operand1.isInteger) || (operand2.constantValue === 1 && operand2.isInteger);
}

export function isZeroMultiplication(operand1: StackItem, operand2: StackItem): boolean {
	return (operand1.constantValue === 0 && operand1.isInteger) || (operand2.constantValue === 0 && operand2.isInteger);
}

export function isIdentityAddition(operand1: StackItem, operand2: StackItem): boolean {
	return (operand1.constantValue === 0 && operand1.isInteger) || (operand2.constantValue === 0 && operand2.isInteger);
}

export function isIdentitySubtraction(operand2: StackItem): boolean {
	return operand2.constantValue === 0 && operand2.isInteger;
}
