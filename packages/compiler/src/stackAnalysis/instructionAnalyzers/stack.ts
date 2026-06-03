import type { CompilationContext, Stack, StackItem, StackValueType } from '@8f4e/compiler-spec';

/** Creates a value stack item with optional known-value metadata preserved for later guards. */
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

/** Clones stack items deeply enough to snapshot mutable address metadata safely. */
export function cloneStack(stack: Stack): Stack {
	return stack.map(item => ({
		...item,
		...(item.kind === 'address' ? { address: { ...item.address } } : {}),
		...(item.kind === 'address' && item.pointsTo ? { pointsTo: { ...item.pointsTo } } : {}),
	}));
}

/** Removes and returns the requested number of items from the top of the semantic stack. */
export function consume(context: CompilationContext, count: number): Stack {
	if (count === 0) {
		return [];
	}

	return context.stack.splice(context.stack.length - count, count);
}

/** Appends newly produced items to the semantic stack. */
export function produce(context: CompilationContext, items: Stack): void {
	context.stack.push(...items);
}
