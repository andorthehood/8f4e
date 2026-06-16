import type { StackItem } from '@8f4e/compiler-spec';

export function areAllOperandsIntegers(...operands: StackItem[]): boolean {
	return operands.every(operand => operand.valueType === 'int');
}

export function areAllOperandsFloats(...operands: StackItem[]): boolean {
	return operands.every(operand => operand.valueType === 'float' || operand.valueType === 'float64');
}

export function areAllOperandsFloat64(...operands: StackItem[]): boolean {
	return operands.length > 0 && operands.every(operand => operand.valueType === 'float64');
}

export function hasMixedFloatWidth(...operands: StackItem[]): boolean {
	const floats = operands.filter(op => op.valueType === 'float' || op.valueType === 'float64');
	return floats.some(op => op.valueType === 'float64') && floats.some(op => op.valueType === 'float');
}
