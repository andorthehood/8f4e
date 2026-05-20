import {
	f32const,
	f32load,
	f64const,
	f64load,
	i32const,
	i32load,
	i32load16s,
	i32load8s,
} from '@8f4e/compiler-wasm-utils';

import {
	getDereferencedValueKindFromMetadata,
	getDereferencedValueWordSizeFromMetadata,
	type PointerMetadata,
} from '../../utils/memoryData';

import type { DataStructure, StackItem } from '@8f4e/compiler-spec';

export type PushValueKind = 'int32' | 'float32' | 'float64';
type PointerValueSource = 'pointer-slot' | 'pointer-value';

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

export const constOpcode: Record<PushValueKind, (value: number) => number[]> = {
	int32: i32const,
	float32: f32const,
	float64: f64const,
};

export const loadOpcode: Record<PushValueKind, (memoryIndex: number) => number[]> = {
	int32: memoryIndex => i32load(2, 0, memoryIndex),
	float32: memoryIndex => f32load(2, 0, memoryIndex),
	float64: memoryIndex => f64load(3, 0, memoryIndex),
};

export function kindToStackItem(kind: PushValueKind, extras?: Partial<StackItem>): StackItem {
	return {
		isInteger: kind === 'int32',
		...(kind === 'float64' ? { isFloat64: true } : {}),
		...extras,
	};
}

export function buildPointerDereferenceByteCode(
	pointerMetadata: PointerMetadata,
	baseAddressByteCode: number[],
	pointerValueSource: PointerValueSource
): { kind: PushValueKind; byteCode: number[] } {
	const kind = resolvePointerTargetValueKind(pointerMetadata);
	const dereferencedValueWordSize = getDereferencedValueWordSizeFromMetadata(pointerMetadata);
	const slotMemoryIndex =
		pointerValueSource === 'pointer-slot' && 'memoryIndex' in pointerMetadata ? pointerMetadata.memoryIndex : 0;
	const pointeeMemoryIndex = 'pointeeMemoryIndex' in pointerMetadata ? (pointerMetadata.pointeeMemoryIndex ?? 0) : 0;
	const finalLoad =
		dereferencedValueWordSize === 1
			? i32load8s(0, 0, pointeeMemoryIndex)
			: dereferencedValueWordSize === 2
				? i32load16s(1, 0, pointeeMemoryIndex)
				: loadOpcode[kind](pointeeMemoryIndex);

	const pointerLoadCount =
		pointerValueSource === 'pointer-slot'
			? pointerMetadata.isPointingToPointer
				? 2
				: 1
			: pointerMetadata.isPointingToPointer
				? 1
				: 0;

	const byteCode = [...baseAddressByteCode];
	for (let i = 0; i < pointerLoadCount; i++) {
		byteCode.push(
			...i32load(2, 0, i === 0 && pointerValueSource === 'pointer-slot' ? slotMemoryIndex : pointeeMemoryIndex)
		);
	}
	byteCode.push(...finalLoad);

	return { kind, byteCode };
}
