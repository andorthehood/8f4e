import { describe, it, expect } from 'vitest';

import parseOutputs from './codeParser';

describe('parseOutputs', () => {
	it('should parse int instruction', () => {
		const code = ['int myOutput'];
		const result = parseOutputs(code);

		expect(result).toEqual([
			{
				id: 'myOutput',
				lineNumber: 0,
			},
		]);
	});

	it('should parse float instruction', () => {
		const code = ['float myOutput'];
		const result = parseOutputs(code);

		expect(result).toEqual([
			{
				id: 'myOutput',
				lineNumber: 0,
			},
		]);
	});

	it('should parse float64 instruction', () => {
		const code = ['float64 myOutput'];
		const result = parseOutputs(code);

		expect(result).toEqual([
			{
				id: 'myOutput',
				lineNumber: 0,
			},
		]);
	});

	it('should parse anonymous allocation', () => {
		const code = ['int 2'];
		const result = parseOutputs(code);

		expect(result).toEqual([
			{
				id: '__anonymous__0',
				lineNumber: 0,
			},
		]);
	});

	it('should parse anonymous allocation with const', () => {
		const code = ['int CONST'];
		const result = parseOutputs(code);

		expect(result).toEqual([
			{
				id: '__anonymous__0',
				lineNumber: 0,
			},
		]);
	});

	it('should parse int[] instruction', () => {
		const code = ['int[] myOutput'];
		const result = parseOutputs(code);

		expect(result).toEqual([
			{
				id: 'myOutput',
				lineNumber: 0,
			},
		]);
	});

	it('should parse float[] instruction', () => {
		const code = ['float[] myOutput'];
		const result = parseOutputs(code);

		expect(result).toEqual([
			{
				id: 'myOutput',
				lineNumber: 0,
			},
		]);
	});

	it('should parse float64[] instruction', () => {
		const code = ['float64[] myOutput'];
		const result = parseOutputs(code);

		expect(result).toEqual([
			{
				id: 'myOutput',
				lineNumber: 0,
			},
		]);
	});

	it('should handle multiple output instructions of different types', () => {
		const code = [
			'int output1',
			'mov a b',
			'float output2',
			'int[] output3',
			'float[] output4',
			'float64 output5',
			'float64[] output6',
		];
		const result = parseOutputs(code);

		expect(result).toEqual([
			{
				id: 'output1',
				lineNumber: 0,
			},
			{
				id: 'output2',
				lineNumber: 2,
			},
			{
				id: 'output3',
				lineNumber: 3,
			},
			{
				id: 'output4',
				lineNumber: 4,
			},
			{
				id: 'output5',
				lineNumber: 5,
			},
			{
				id: 'output6',
				lineNumber: 6,
			},
		]);
	});

	it('should return empty array when no output instructions found', () => {
		const code = ['mov a b', 'add c d', 'sub e f'];
		const result = parseOutputs(code);

		expect(result).toEqual([]);
	});

	it('should handle empty code array', () => {
		const code: string[] = [];
		const result = parseOutputs(code);

		expect(result).toEqual([]);
	});

	it('should not match pointer types', () => {
		const code = ['int* myVar', 'float* myOtherVar'];
		const result = parseOutputs(code);

		expect(result).toEqual([]);
	});

	it('should preserve correct line numbers', () => {
		const code = ['nop', 'nop', 'int output1', 'nop', 'nop', 'float output2'];
		const result = parseOutputs(code);

		expect(result).toEqual([
			{
				id: 'output1',
				lineNumber: 2,
			},
			{
				id: 'output2',
				lineNumber: 5,
			},
		]);
	});

	it('should treat all-uppercase names as anonymous allocations', () => {
		const code = ['int MY_CONSTANT', 'float ANOTHER_CONST'];
		const result = parseOutputs(code);

		expect(result).toEqual([
			{
				id: '__anonymous__0',
				lineNumber: 0,
			},
			{
				id: '__anonymous__1',
				lineNumber: 1,
			},
		]);
	});
});
