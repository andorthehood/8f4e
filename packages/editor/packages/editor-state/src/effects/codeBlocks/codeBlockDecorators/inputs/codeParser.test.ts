import { describe, it, expect } from 'vitest';
import { parseInputs } from './codeParser';

describe('parseInputs', () => {
	it('should parse int* instruction', () => {
		const code = ['int* myInput'];
		const result = parseInputs(code);

		expect(result).toEqual([
			{
				id: 'myInput',
				lineNumber: 0,
			},
		]);
	});

	it('should parse float* instruction', () => {
		const code = ['float* myInput'];
		const result = parseInputs(code);

		expect(result).toEqual([
			{
				id: 'myInput',
				lineNumber: 0,
			},
		]);
	});

	it('should parse int** instruction', () => {
		const code = ['int** myInput'];
		const result = parseInputs(code);

		expect(result).toEqual([
			{
				id: 'myInput',
				lineNumber: 0,
			},
		]);
	});

	it('should parse float** instruction', () => {
		const code = ['float** myInput'];
		const result = parseInputs(code);

		expect(result).toEqual([
			{
				id: 'myInput',
				lineNumber: 0,
			},
		]);
	});

	it('should handle multiple input instructions of different types', () => {
		const code = ['int* input1', 'mov a b', 'float* input2', 'int** input3', 'float** input4'];
		const result = parseInputs(code);

		expect(result).toEqual([
			{
				id: 'input1',
				lineNumber: 0,
			},
			{
				id: 'input2',
				lineNumber: 2,
			},
			{
				id: 'input3',
				lineNumber: 3,
			},
			{
				id: 'input4',
				lineNumber: 4,
			},
		]);
	});

	it('should return empty array when no input instructions found', () => {
		const code = ['mov a b', 'add c d', 'int x', 'float y'];
		const result = parseInputs(code);

		expect(result).toEqual([]);
	});

	it('should handle empty code array', () => {
		const code: string[] = [];
		const result = parseInputs(code);

		expect(result).toEqual([]);
	});

	it('should not match single int or float declarations', () => {
		const code = ['int myVar', 'float myOtherVar'];
		const result = parseInputs(code);

		expect(result).toEqual([]);
	});

	it('should preserve correct line numbers', () => {
		const code = ['nop', 'nop', 'int* input1', 'nop', 'nop', 'float* input2'];
		const result = parseInputs(code);

		expect(result).toEqual([
			{
				id: 'input1',
				lineNumber: 2,
			},
			{
				id: 'input2',
				lineNumber: 5,
			},
		]);
	});
});

