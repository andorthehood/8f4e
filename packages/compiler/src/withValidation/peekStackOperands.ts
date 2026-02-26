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

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('peekStackOperands', () => {
		it('returns the last N operands in stack order', () => {
			const stack: StackItem[] = [{ isInteger: true }, { isInteger: false }, { isInteger: true }];
			expect(peekStackOperands(stack, 2)).toEqual([{ isInteger: false }, { isInteger: true }]);
		});

		it('returns an empty array when there are not enough operands', () => {
			const stack: StackItem[] = [{ isInteger: true }];
			expect(peekStackOperands(stack, 2)).toEqual([]);
		});
	});
}
