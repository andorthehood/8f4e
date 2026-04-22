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

import type { DataStructure, LocalBinding, StackItem } from '../../types';

export type PushValueKind = 'int32' | 'float32' | 'float64';
type PointerMetadata =
	| Pick<DataStructure, 'pointeeBaseType' | 'isPointingToPointer'>
	| Pick<LocalBinding, 'pointeeBaseType' | 'isPointingToPointer'>;
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

export function resolvePointerTargetValueKind(
	memoryItem: Pick<DataStructure, 'pointeeBaseType'> | Pick<LocalBinding, 'pointeeBaseType'>
): PushValueKind {
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

export function buildPointerDereferenceByteCode(
	pointerMetadata: PointerMetadata,
	baseAddressByteCode: number[],
	pointerValueSource: PointerValueSource
): { kind: PushValueKind; byteCode: number[] } {
	const kind = resolvePointerTargetValueKind(pointerMetadata);
	const finalLoad =
		pointerMetadata.pointeeBaseType === 'int8'
			? i32load8s()
			: pointerMetadata.pointeeBaseType === 'int16'
				? i32load16s()
				: loadOpcode[kind]();

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
		byteCode.push(...i32load());
	}
	byteCode.push(...finalLoad);

	return { kind, byteCode };
}
