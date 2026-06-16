import type { FunctionValueType, LocalBinding, StackItem } from '@8f4e/compiler-spec';
import { POINTER_FUNCTION_TYPE_IDENTIFIERS } from '@8f4e/compiler-spec';

type PointerFunctionValueType = Extract<FunctionValueType, `${string}*`>;
type PointerFunctionPointeeBaseType = NonNullable<LocalBinding['pointeeBaseType']>;

const POINTER_FUNCTION_VALUE_TYPES = new Set<PointerFunctionValueType>(POINTER_FUNCTION_TYPE_IDENTIFIERS);

function isPointerFunctionValueType(type: FunctionValueType): type is PointerFunctionValueType {
	return POINTER_FUNCTION_VALUE_TYPES.has(type as PointerFunctionValueType);
}

function getPointerParts(type: PointerFunctionValueType) {
	const pointerDepth = type.endsWith('**') ? 2 : 1;
	const baseType = type.replace(/\*+$/, '') as PointerFunctionPointeeBaseType;
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

export function functionValueTypeToStackItem(type: FunctionValueType): StackItem {
	return localBindingToStackItem(functionValueTypeToLocalBinding(type, 0));
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
