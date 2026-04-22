import { Type } from '@8f4e/compiler-wasm-utils';
import { POINTER_FUNCTION_TYPE_IDENTIFIERS } from '@8f4e/tokenizer';

import getMemoryFlags from './memoryFlags';

import type { FunctionValueType, LocalBinding, StackItem } from '../types';

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
	const flags = getMemoryFlags(baseType, pointerDepth);
	return {
		isInteger: flags.isInteger,
		...(flags.isFloat64 ? { isFloat64: true } : {}),
		...(flags.pointeeBaseType ? { pointeeBaseType: flags.pointeeBaseType } : {}),
		...(flags.isPointingToPointer ? { isPointingToPointer: true } : {}),
		index,
	};
}

export function functionValueTypeToStackItem(type: FunctionValueType): StackItem {
	const binding = functionValueTypeToLocalBinding(type, 0);
	return {
		isInteger: binding.isInteger,
		...(binding.isFloat64 ? { isFloat64: true } : {}),
		...(binding.pointeeBaseType ? { pointeeBaseType: binding.pointeeBaseType } : {}),
		...(binding.isPointingToPointer ? { isPointingToPointer: true } : {}),
	};
}

export function functionValueTypeToWasmType(type: FunctionValueType): Type {
	if (type === 'float64') {
		return Type.F64;
	}

	if (type === 'float') {
		return Type.F32;
	}

	return Type.I32;
}

export function stackItemMatchesFunctionValueType(stackItem: StackItem, type: FunctionValueType): boolean {
	if (type === 'int') {
		return stackItem.isInteger;
	}

	if (type === 'float') {
		return !stackItem.isInteger && !stackItem.isFloat64;
	}

	if (type === 'float64') {
		return !stackItem.isInteger && !!stackItem.isFloat64;
	}

	if (!stackItem.isInteger) {
		return false;
	}

	// Generic integer addresses (e.g. literals or &buffer folded to i32) are accepted for pointer params/returns.
	// When pointer metadata is present, preserve stricter pointee/depth compatibility.
	if (!stackItem.pointeeBaseType) {
		return true;
	}

	const expected = functionValueTypeToStackItem(type);
	return (
		stackItem.pointeeBaseType === expected.pointeeBaseType &&
		!!stackItem.isPointingToPointer === !!expected.isPointingToPointer
	);
}
