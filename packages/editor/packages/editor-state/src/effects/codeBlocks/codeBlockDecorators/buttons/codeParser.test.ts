import { describe, it, expect } from 'vitest';
import { parseButtons } from './codeParser';

describe('parseButtons', () => {
	it('should parse button instruction with all arguments', () => {
		const code = ['button myButton 0 1'];
		const result = parseButtons(code);

		expect(result).toEqual([
			{
				id: 'myButton',
				lineNumber: 0,
				offValue: 0,
				onValue: 1,
			},
		]);
	});

	it('should parse button instruction with default off/on values', () => {
		const code = ['button myButton'];
		const result = parseButtons(code);

		expect(result).toEqual([
			{
				id: 'myButton',
				lineNumber: 0,
				offValue: 0,
				onValue: 1,
			},
		]);
	});

	it('should parse button instruction with custom values', () => {
		const code = ['button myButton 10 100'];
		const result = parseButtons(code);

		expect(result).toEqual([
			{
				id: 'myButton',
				lineNumber: 0,
				offValue: 10,
				onValue: 100,
			},
		]);
	});

	it('should handle multiple button instructions', () => {
		const code = ['button btn1 0 1', 'mov a b', 'button btn2 5 15'];
		const result = parseButtons(code);

		expect(result).toEqual([
			{
				id: 'btn1',
				lineNumber: 0,
				offValue: 0,
				onValue: 1,
			},
			{
				id: 'btn2',
				lineNumber: 2,
				offValue: 5,
				onValue: 15,
			},
		]);
	});

	it('should return empty array when no button instructions found', () => {
		const code = ['mov a b', 'add c d', 'sub e f'];
		const result = parseButtons(code);

		expect(result).toEqual([]);
	});

	it('should handle empty code array', () => {
		const code: string[] = [];
		const result = parseButtons(code);

		expect(result).toEqual([]);
	});

	it('should use default values when off/on are invalid numbers', () => {
		const code = ['button myButton invalid invalid'];
		const result = parseButtons(code);

		expect(result).toEqual([
			{
				id: 'myButton',
				lineNumber: 0,
				offValue: 0,
				onValue: 1,
			},
		]);
	});
});

