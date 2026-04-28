import type { StackItem } from '../types';

export function areAllOperandsIntegers(...operands: StackItem[]): boolean {
	return operands.every(operand => operand.isInteger);
}

export function areAllOperandsFloats(...operands: StackItem[]): boolean {
	return operands.every(operand => !operand.isInteger);
}

export function areAllOperandsFloat64(...operands: StackItem[]): boolean {
	return operands.length > 0 && operands.every(operand => !operand.isInteger && operand.isFloat64 === true);
}

export function hasMixedFloatWidth(...operands: StackItem[]): boolean {
	const floats = operands.filter(op => !op.isInteger);
	return floats.some(op => op.isFloat64) && floats.some(op => !op.isFloat64);
}
