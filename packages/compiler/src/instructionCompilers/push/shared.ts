import f32const from '../../wasmUtils/const/f32const';
import f64const from '../../wasmUtils/const/f64const';
import i32const from '../../wasmUtils/const/i32const';
import f32load from '../../wasmUtils/load/f32load';
import f64load from '../../wasmUtils/load/f64load';
import i32load from '../../wasmUtils/load/i32load';

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
	if (memoryItem.isPointingToInteger) return 'int32';
	const memoryType = String(memoryItem.type);
	if (memoryType.startsWith('float64')) return 'float64';
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
	return { isInteger: kind === 'int32', ...(kind === 'float64' ? { isFloat64: true } : {}), ...extras };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('push shared helpers', () => {
		it('resolves value kinds correctly', () => {
			expect(resolveArgumentValueKind({ isInteger: true })).toBe('int32');
			expect(resolveArgumentValueKind({ isInteger: false })).toBe('float32');
			expect(resolveArgumentValueKind({ isInteger: false, isFloat64: true })).toBe('float64');
			expect(resolvePointerTargetValueKind({ isPointingToInteger: true } as never)).toBe('int32');
			expect(resolvePointerTargetValueKind({ isPointingToInteger: false, type: 'float64*' } as never)).toBe(
				'float64'
			);
		});

		it('creates stack items with expected shape', () => {
			expect(kindToStackItem('int32', { isNonZero: true })).toEqual({ isInteger: true, isNonZero: true });
			expect(kindToStackItem('float64', { isNonZero: false })).toEqual({
				isInteger: false,
				isFloat64: true,
				isNonZero: false,
			});
		});
	});
}
