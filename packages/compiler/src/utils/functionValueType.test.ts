import type { FunctionValueType, StackItem } from '@8f4e/compiler-spec';
import { WASM_TYPE_F32, WASM_TYPE_F64, WASM_TYPE_I32 } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';
import {
	functionValueTypeToLocalBinding,
	functionValueTypeToStackItem,
	functionValueTypeToWasmType,
	stackItemMatchesFunctionValueType,
} from './functionValueType';

describe('function value type helpers', () => {
	it.each([
		['int', { isInteger: true, index: 2 }],
		['float', { isInteger: false, index: 2 }],
		['float64', { isInteger: false, isFloat64: true, index: 2 }],
		[
			'int*',
			{
				isInteger: true,
				pointeeBaseType: 'int',
				pointerDepth: 1,
				index: 2,
			},
		],
		[
			'int8u*',
			{
				isInteger: true,
				pointeeBaseType: 'int8u',
				pointerDepth: 1,
				index: 2,
			},
		],
		[
			'float64**',
			{
				isInteger: true,
				pointeeBaseType: 'float64',
				pointerDepth: 2,
				index: 2,
			},
		],
		['opaque', { isInteger: false, index: 2 }],
	])('converts %s to a local binding', (type, expected) => {
		expect(functionValueTypeToLocalBinding(type as FunctionValueType, 2)).toEqual(expected);
	});

	it.each([
		['int', { kind: 'value', valueType: 'int' }],
		['float', { kind: 'value', valueType: 'float' }],
		['float64', { kind: 'value', valueType: 'float64' }],
		[
			'int*',
			{
				kind: 'address',
				valueType: 'int',
				address: { memoryIndex: 0 },
				pointsTo: { baseType: 'int', memoryIndex: 0, pointerDepth: 1 },
			},
		],
		[
			'int16u**',
			{
				kind: 'address',
				valueType: 'int',
				address: { memoryIndex: 0 },
				pointsTo: { baseType: 'int16u', memoryIndex: 0, pointerDepth: 2 },
			},
		],
		[
			'float**',
			{
				kind: 'address',
				valueType: 'int',
				address: { memoryIndex: 0 },
				pointsTo: { baseType: 'float', memoryIndex: 0, pointerDepth: 2 },
			},
		],
	])('converts %s to a stack item', (type, expected) => {
		expect(functionValueTypeToStackItem(type as FunctionValueType)).toEqual(expected);
	});

	it.each([
		['int', WASM_TYPE_I32],
		['int*', WASM_TYPE_I32],
		['int8u*', WASM_TYPE_I32],
		['float', WASM_TYPE_F32],
		['float64', WASM_TYPE_F64],
	])('converts %s to a wasm type', (type, expected) => {
		expect(functionValueTypeToWasmType(type as FunctionValueType)).toBe(expected);
	});

	it('matches scalar and pointer stack items to function value types', () => {
		const genericAddress = { kind: 'value', valueType: 'int' } as StackItem;
		const intPointer = functionValueTypeToStackItem('int*');
		const int8uPointer = functionValueTypeToStackItem('int8u*');
		const floatPointer = functionValueTypeToStackItem('float*');
		const intDoublePointer = functionValueTypeToStackItem('int**');

		expect(stackItemMatchesFunctionValueType({ kind: 'value', valueType: 'int' }, 'int')).toBe(true);
		expect(stackItemMatchesFunctionValueType({ kind: 'value', valueType: 'float' }, 'float')).toBe(true);
		expect(stackItemMatchesFunctionValueType({ kind: 'value', valueType: 'float64' }, 'float64')).toBe(true);
		expect(stackItemMatchesFunctionValueType({ kind: 'value', valueType: 'float' }, 'int')).toBe(false);
		expect(stackItemMatchesFunctionValueType({ kind: 'value', valueType: 'float' }, 'int*')).toBe(false);
		expect(stackItemMatchesFunctionValueType(genericAddress, 'int*')).toBe(true);
		expect(stackItemMatchesFunctionValueType(intPointer, 'int*')).toBe(true);
		expect(stackItemMatchesFunctionValueType(int8uPointer, 'int8u*')).toBe(true);
		expect(stackItemMatchesFunctionValueType(int8uPointer, 'int8*')).toBe(false);
		expect(stackItemMatchesFunctionValueType(intPointer, 'float*')).toBe(false);
		expect(stackItemMatchesFunctionValueType(floatPointer, 'float**')).toBe(false);
		expect(stackItemMatchesFunctionValueType(intDoublePointer, 'int*')).toBe(false);
		expect(stackItemMatchesFunctionValueType(intPointer, 'opaque' as FunctionValueType)).toBe(true);
	});
});
