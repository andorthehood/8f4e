import { describe, it, expect } from 'vitest';

import parseSwitches from './codeParser';

describe('parseSwitches', () => {
	it('should parse switch instruction with all arguments', () => {
		const code = ['# switch mySwitch 0 1'];
		const result = parseSwitches(code);

		expect(result).toEqual([
			{
				id: 'mySwitch',
				lineNumber: 0,
				offValue: 0,
				onValue: 1,
			},
		]);
	});

	it('should parse switch instruction with default off/on values', () => {
		const code = ['# switch mySwitch'];
		const result = parseSwitches(code);

		expect(result).toEqual([
			{
				id: 'mySwitch',
				lineNumber: 0,
				offValue: 0,
				onValue: 1,
			},
		]);
	});

	it('should parse switch instruction with custom values', () => {
		const code = ['# switch mySwitch 10 100'];
		const result = parseSwitches(code);

		expect(result).toEqual([
			{
				id: 'mySwitch',
				lineNumber: 0,
				offValue: 10,
				onValue: 100,
			},
		]);
	});

	it('should handle multiple switch instructions', () => {
		const code = ['# switch sw1 0 1', 'mov a b', '# switch sw2 5 15'];
		const result = parseSwitches(code);

		expect(result).toEqual([
			{
				id: 'sw1',
				lineNumber: 0,
				offValue: 0,
				onValue: 1,
			},
			{
				id: 'sw2',
				lineNumber: 2,
				offValue: 5,
				onValue: 15,
			},
		]);
	});

	it('should return empty array when no switch instructions found', () => {
		const code = ['mov a b', 'add c d', 'sub e f'];
		const result = parseSwitches(code);

		expect(result).toEqual([]);
	});

	it('should handle empty code array', () => {
		const code: string[] = [];
		const result = parseSwitches(code);

		expect(result).toEqual([]);
	});

	it('should use default values when off/on are invalid numbers', () => {
		const code = ['# switch mySwitch invalid invalid'];
		const result = parseSwitches(code);

		expect(result).toEqual([
			{
				id: 'mySwitch',
				lineNumber: 0,
				offValue: 0,
				onValue: 1,
			},
		]);
	});

	it('should preserve correct line numbers', () => {
		const code = ['nop', 'nop', '# switch sw1 0 1', 'nop', 'nop', '# switch sw2 5 10'];
		const result = parseSwitches(code);

		expect(result).toEqual([
			{
				id: 'sw1',
				lineNumber: 2,
				offValue: 0,
				onValue: 1,
			},
			{
				id: 'sw2',
				lineNumber: 5,
				offValue: 5,
				onValue: 10,
			},
		]);
	});
});
