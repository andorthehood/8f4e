import type { CompilationContext, Stack, StackItem, StackValueType } from '@8f4e/compiler-spec';

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

export function cloneStack(stack: Stack): Stack {
	return stack.map(item => ({
		...item,
		...(item.kind === 'address' ? { address: { ...item.address } } : {}),
		...(item.kind === 'address' && item.pointsTo ? { pointsTo: { ...item.pointsTo } } : {}),
	}));
}

export function consume(context: CompilationContext, count: number): Stack {
	if (count === 0) {
		return [];
	}

	return context.stack.splice(context.stack.length - count, count);
}

export function produce(context: CompilationContext, items: Stack): void {
	context.stack.push(...items);
}
