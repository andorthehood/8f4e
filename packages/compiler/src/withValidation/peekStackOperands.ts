import type { StackItem } from '../types';

export function peekStackOperands(stack: StackItem[], count: number): StackItem[] {
	if (stack.length < count) {
		return [];
	}
	const operands: StackItem[] = [];
	const startIndex = stack.length - count;
	for (let i = 0; i < count; i++) {
		operands.push(stack[startIndex + i]);
	}
	return operands;
}
