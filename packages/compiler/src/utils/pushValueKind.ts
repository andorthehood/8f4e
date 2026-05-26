import { WASM_TYPE_F32, WASM_TYPE_F64, WASM_TYPE_I32 } from '@8f4e/compiler-wasm-utils';

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

export function valueKindToWasmType(
	kind: PushValueKind
): typeof WASM_TYPE_I32 | typeof WASM_TYPE_F32 | typeof WASM_TYPE_F64 {
	if (kind === 'float64') {
		return WASM_TYPE_F64;
	}

	return kind === 'float32' ? WASM_TYPE_F32 : WASM_TYPE_I32;
}

type StackItemExtras = Pick<StackItem, 'isNonZero' | 'knownIntegerValue'> &
	Partial<Pick<Extract<StackItem, { kind: 'address' }>, 'address' | 'pointsTo'>>;

export function kindToStackItem(kind: PushValueKind, extras?: StackItemExtras): StackItem {
	if (kind === 'int32' && extras?.address) {
		return {
			kind: 'address',
			valueType: 'int',
			address: extras.address,
			...(extras.pointsTo ? { pointsTo: extras.pointsTo } : {}),
			...(extras.isNonZero !== undefined ? { isNonZero: extras.isNonZero } : {}),
			...(extras.knownIntegerValue !== undefined ? { knownIntegerValue: extras.knownIntegerValue } : {}),
		};
	}

	return {
		kind: 'value',
		valueType: kind === 'int32' ? 'int' : kind === 'float64' ? 'float64' : 'float',
		...(extras?.isNonZero !== undefined ? { isNonZero: extras.isNonZero } : {}),
		...(extras?.knownIntegerValue !== undefined ? { knownIntegerValue: extras.knownIntegerValue } : {}),
	};
}
