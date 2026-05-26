import { isStackFloat64, isStackInteger } from '@8f4e/compiler-spec';

import type { StackItem } from '@8f4e/compiler-spec';

export function areAllOperandsIntegers(...operands: StackItem[]): boolean {
	return operands.every(operand => isStackInteger(operand));
}

export function areAllOperandsFloats(...operands: StackItem[]): boolean {
	return operands.every(operand => !isStackInteger(operand));
}

export function areAllOperandsFloat64(...operands: StackItem[]): boolean {
	return operands.length > 0 && operands.every(operand => !isStackInteger(operand) && isStackFloat64(operand));
}

export function hasMixedFloatWidth(...operands: StackItem[]): boolean {
	const floats = operands.filter(op => !isStackInteger(op));
	return floats.some(op => isStackFloat64(op)) && floats.some(op => !isStackFloat64(op));
}
