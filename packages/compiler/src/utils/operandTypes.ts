import type { StackItem } from '@8f4e/compiler-spec';

/** Returns whether every operand is an integer stack value. */
export function areAllOperandsIntegers(...operands: StackItem[]): boolean {
	return operands.every(operand => operand.valueType === 'int');
}

/** Returns whether every operand is any supported float stack value. */
export function areAllOperandsFloats(...operands: StackItem[]): boolean {
	return operands.every(operand => operand.valueType === 'float' || operand.valueType === 'float64');
}

/** Returns whether every operand is a float64 stack value and at least one operand exists. */
export function areAllOperandsFloat64(...operands: StackItem[]): boolean {
	return operands.length > 0 && operands.every(operand => operand.valueType === 'float64');
}

/** Returns whether the operands mix float32 and float64 stack values. */
export function hasMixedFloatWidth(...operands: StackItem[]): boolean {
	const floats = operands.filter(op => op.valueType === 'float' || op.valueType === 'float64');
	return floats.some(op => op.valueType === 'float64') && floats.some(op => op.valueType === 'float');
}
