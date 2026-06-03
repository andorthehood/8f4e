import type { StackItem } from '@8f4e/compiler-spec';

/**
 * Reads the top stack operands without mutating the stack, returning an empty list when unavailable.
 *
 * @param stack - Stack to inspect or clone.
 * @param count - Number of stack items to inspect or consume.
 * @returns The stack items produced or consumed by the operation.
 */
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
