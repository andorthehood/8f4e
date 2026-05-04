import { describe, expect, test } from 'vitest';

import isAllZeroBytes from './isAllZeroBytes';

describe('isAllZeroBytes', () => {
	test('returns true only when every byte is zero', () => {
		expect(isAllZeroBytes(new Uint8Array([0, 0, 0]))).toBe(true);
		expect(isAllZeroBytes(new Uint8Array([0, 1, 0]))).toBe(false);
	});
});
