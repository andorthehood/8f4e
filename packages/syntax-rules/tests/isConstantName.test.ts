import { describe, it, expect } from 'vitest';

import { isConstantName } from '../src/isConstantName';

describe('isConstantName', () => {
	it('returns true for all uppercase names', () => {
		expect(isConstantName('CONST')).toBe(true);
		expect(isConstantName('MY_CONSTANT')).toBe(true);
		expect(isConstantName('ANOTHER_ONE')).toBe(true);
	});

	it('returns true for uppercase with numbers', () => {
		expect(isConstantName('CONST123')).toBe(true);
		expect(isConstantName('MY_CONSTANT_2')).toBe(true);
		expect(isConstantName('VAR1')).toBe(true);
	});

	it('returns true for uppercase with special characters', () => {
		expect(isConstantName('CONST$VALUE')).toBe(true);
		expect(isConstantName('MY_CONSTANT!')).toBe(true);
		expect(isConstantName('VAR-NAME')).toBe(true);
	});

	it('returns false for names with lowercase letters', () => {
		expect(isConstantName('MyVariable')).toBe(false);
		expect(isConstantName('myVariable')).toBe(false);
		expect(isConstantName('CONST_value')).toBe(false);
		expect(isConstantName('camelCase')).toBe(false);
	});

	it('returns false for all lowercase names', () => {
		expect(isConstantName('variable')).toBe(false);
		expect(isConstantName('my_var')).toBe(false);
	});

	it('returns false for empty string', () => {
		expect(isConstantName('')).toBe(false);
	});

	it('returns false for strings starting with numbers', () => {
		expect(isConstantName('123')).toBe(false);
		expect(isConstantName('456ABC')).toBe(false);
	});

	it('returns false for strings starting with special characters', () => {
		expect(isConstantName('$SPECIAL')).toBe(false);
		expect(isConstantName('_CONSTANT')).toBe(false);
		expect(isConstantName('!VALUE')).toBe(false);
	});

	it('returns false for strings with only special characters', () => {
		expect(isConstantName('$$$')).toBe(false);
		expect(isConstantName('___')).toBe(false);
		expect(isConstantName('!!!')).toBe(false);
	});
});
