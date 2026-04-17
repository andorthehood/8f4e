import { f32const, f32load, f64const, f64load, i32const, i32load } from '@8f4e/compiler-wasm-utils';

import type { DataStructure, StackItem } from '../../types';

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

export function resolvePointerTargetValueKind(memoryItem: DataStructure): PushValueKind {
	if (
		memoryItem.pointeeBaseType === 'int' ||
		memoryItem.pointeeBaseType === 'int8' ||
		memoryItem.pointeeBaseType === 'int16'
	)
		return 'int32';
	if (memoryItem.pointeeBaseType === 'float64') return 'float64';
	return 'float32';
}

export const constOpcode: Record<PushValueKind, (value: number) => number[]> = {
	int32: i32const,
	float32: f32const,
	float64: f64const,
};

export const loadOpcode: Record<PushValueKind, () => number[]> = {
	int32: () => i32load(),
	float32: () => f32load(),
	float64: () => f64load(),
};

export function kindToStackItem(kind: PushValueKind, extras?: Partial<StackItem>): StackItem {
	return {
		isInteger: kind === 'int32',
		...(kind === 'float64' ? { isFloat64: true } : {}),
		...extras,
	};
}
