import {
	createFunctionId,
	createFunctionParameterSignatureKey,
	encodeFunctionValueType,
	type FunctionValueType,
} from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

describe('function type id helpers', () => {
	it.each([
		['int', 'int'],
		['float', 'float'],
		['float64', 'float64'],
		['int*', 'int_p'],
		['int**', 'int_p_p'],
		['int8u*', 'int8u_p'],
		['int16u**', 'int16u_p_p'],
		['float*', 'float_p'],
		['float64**', 'float64_p_p'],
	] satisfies Array<[FunctionValueType, string]>)('encodes %s as %s', (type, encoded) => {
		expect(encodeFunctionValueType(type)).toBe(encoded);
	});

	it('uses void as the zero-parameter signature key', () => {
		expect(createFunctionParameterSignatureKey([])).toBe('void');
	});

	it('joins encoded parameter types in source order', () => {
		expect(createFunctionParameterSignatureKey(['float*', 'float*', 'int'])).toBe('float_p__float_p__int');
	});

	it('creates a source name plus parameter signature id', () => {
		expect(createFunctionId('tick', [])).toBe('tick__void');
		expect(createFunctionId('wrapPointer', ['float*', 'float*', 'int'])).toBe('wrapPointer__float_p__float_p__int');
	});
});
