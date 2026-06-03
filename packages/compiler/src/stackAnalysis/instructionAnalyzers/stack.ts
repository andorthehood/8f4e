import type { CompilationContext, Stack, StackItem, StackValueType } from '@8f4e/compiler-spec';

/**
 * Creates a value stack item with optional known-value metadata preserved for later guards.
 *
 * @param valueType - Stack value type for the item being created.
 * @param metadata - Optional known-value metadata to copy onto the stack item.
 * @returns The stack items produced or consumed by the operation.
 */
export function createStackValue(
	valueType: StackValueType,
	metadata: Pick<StackItem, 'isNonZero' | 'knownIntegerValue'> = {}
): StackItem {
	return {
		kind: 'value',
		valueType,
		...(metadata.isNonZero !== undefined ? { isNonZero: metadata.isNonZero } : {}),
		...(metadata.knownIntegerValue !== undefined ? { knownIntegerValue: metadata.knownIntegerValue } : {}),
	};
}

/**
 * Clones stack items deeply enough to snapshot mutable address metadata safely.
 *
 * @param stack - Stack to inspect or clone.
 * @returns The stack items produced or consumed by the operation.
 */
export function cloneStack(stack: Stack): Stack {
	return stack.map(item => ({
		...item,
		...(item.kind === 'address' ? { address: { ...item.address } } : {}),
		...(item.kind === 'address' && item.pointsTo ? { pointsTo: { ...item.pointsTo } } : {}),
	}));
}

/**
 * Removes and returns the requested number of items from the top of the semantic stack.
 *
 * @param context - Current compiler context consulted or updated by the operation.
 * @param count - Number of stack items to inspect or consume.
 * @returns The stack items produced or consumed by the operation.
 */
export function consume(context: CompilationContext, count: number): Stack {
	if (count === 0) {
		return [];
	}

	return context.stack.splice(context.stack.length - count, count);
}

/**
 * Appends newly produced items to the semantic stack.
 *
 * @param context - Current compiler context consulted or updated by the operation.
 * @param items - items value used by this operation.
 */
export function produce(context: CompilationContext, items: Stack): void {
	context.stack.push(...items);
}
