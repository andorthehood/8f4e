import {
	getDereferencedValueKindFromMetadata,
	getDereferencedValueWordSizeFromMetadata,
	type PointerMetadata,
} from './memoryData';

import type { DataStructure, StackItem } from '@8f4e/compiler-spec';

export type PushValueKind = 'int32' | 'float32' | 'float64';

export function resolveMemoryValueKind(memoryItem: DataStructure): PushValueKind {
	if (memoryItem.isInteger) return 'int32';
	if (memoryItem.isFloat64) return 'float64';
	return 'float32';
}

export function resolveArgumentValueKind(argument: { isInteger: boolean; isFloat64?: boolean }): PushValueKind {
	if (argument.isFloat64) return 'float64';
	return argument.isInteger ? 'int32' : 'float32';
}

export function resolvePointerTargetValueKind(pointerMetadata: PointerMetadata): PushValueKind {
	return getDereferencedValueKindFromMetadata(pointerMetadata);
}

export function getDereferencedValueWordSize(pointerMetadata: PointerMetadata): number {
	return getDereferencedValueWordSizeFromMetadata(pointerMetadata);
}

export function kindToStackItem(kind: PushValueKind, extras?: Partial<StackItem>): StackItem {
	return {
		isInteger: kind === 'int32',
		...(kind === 'float64' ? { isFloat64: true } : {}),
		...extras,
	};
}
