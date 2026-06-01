import { describe, expect, it } from 'vitest';
import getPrototypeId from './getPrototypeId';

describe('getPrototypeId', () => {
	it('extracts the prototype identifier', () => {
		expect(getPrototypeId(['prototype oscillatorState', 'prototypeEnd'])).toBe('oscillatorState');
	});

	it('returns an empty string for non-prototype blocks', () => {
		expect(getPrototypeId(['module oscillator', 'moduleEnd'])).toBe('');
	});
});
