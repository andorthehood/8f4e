import type { FunctionValueType, LocalBinding, StackItem } from '@8f4e/compiler-spec';
import { POINTER_FUNCTION_TYPE_IDENTIFIERS } from '@8f4e/compiler-spec';

import type { WasmTypeValue } from '@8f4e/compiler-wasm-utils';
import { WASM_TYPE_F32, WASM_TYPE_F64, WASM_TYPE_I32 } from '@8f4e/compiler-wasm-utils';

type PointerFunctionValueType = Extract<FunctionValueType, `${string}*`>;

const POINTER_FUNCTION_VALUE_TYPES = new Set<PointerFunctionValueType>(POINTER_FUNCTION_TYPE_IDENTIFIERS);

function isPointerFunctionValueType(type: FunctionValueType): type is PointerFunctionValueType {
	return POINTER_FUNCTION_VALUE_TYPES.has(type as PointerFunctionValueType);
}

function getPointerParts(type: PointerFunctionValueType) {
	const pointerDepth = type.endsWith('**') ? 2 : 1;
	const baseType = type.replace(/\*+$/, '') as 'int' | 'int8' | 'int16' | 'float' | 'float64';
	return { baseType, pointerDepth };
}

export function functionValueTypeToLocalBinding(type: FunctionValueType, index: number): LocalBinding {
	if (type === 'int') {
		return { isInteger: true, index };
	}

	if (type === 'float') {
		return { isInteger: false, index };
	}

	if (type === 'float64') {
		return { isInteger: false, isFloat64: true, index };
	}

	if (!isPointerFunctionValueType(type)) {
		return { isInteger: false, index };
	}

	const { baseType, pointerDepth } = getPointerParts(type);
	return {
		isInteger: true,
		pointeeBaseType: baseType,
		pointerDepth,
		index,
	};
}

export function functionValueTypeToStackItem(type: FunctionValueType): StackItem {
	return localBindingToStackItem(functionValueTypeToLocalBinding(type, 0));
}

function localBindingToStackItem(binding: LocalBinding): StackItem {
	if (binding.pointeeBaseType) {
		return {
			kind: 'address',
			valueType: 'int',
			address: {
				memoryIndex: binding.pointeeMemoryIndex ?? 0,
				...(binding.pointeeMemoryRegionName ? { memoryRegionName: binding.pointeeMemoryRegionName } : {}),
			},
			pointsTo: {
				baseType: binding.pointeeBaseType,
				memoryIndex: binding.pointeeMemoryIndex ?? 0,
				...(binding.pointeeMemoryRegionName ? { memoryRegionName: binding.pointeeMemoryRegionName } : {}),
				pointerDepth: binding.pointerDepth,
			},
		};
	}

	return {
		kind: 'value',
		valueType: binding.isInteger ? 'int' : binding.isFloat64 ? 'float64' : 'float',
	};
}

export function functionValueTypeToWasmType(type: FunctionValueType): WasmTypeValue {
	if (type === 'float64') {
		return WASM_TYPE_F64;
	}

	if (type === 'float') {
		return WASM_TYPE_F32;
	}

	return WASM_TYPE_I32;
}

export function stackItemMatchesFunctionValueType(stackItem: StackItem, type: FunctionValueType): boolean {
	if (type === 'int') {
		return stackItem.valueType === 'int';
	}

	if (type === 'float') {
		return stackItem.valueType === 'float';
	}

	if (type === 'float64') {
		return stackItem.valueType === 'float64';
	}

	if (stackItem.valueType !== 'int') {
		return false;
	}

	// Generic integer addresses (e.g. literals or &buffer folded to i32) are accepted for pointer params/returns.
	// When pointer metadata is present, preserve stricter pointee/depth compatibility.
	if (stackItem.kind !== 'address' || !stackItem.pointsTo) {
		return true;
	}

	const expected = functionValueTypeToStackItem(type);
	if (expected.kind !== 'address' || !expected.pointsTo) {
		return true;
	}

	return (
		stackItem.pointsTo.baseType === expected.pointsTo.baseType &&
		stackItem.pointsTo.pointerDepth === expected.pointsTo.pointerDepth
	);
}
