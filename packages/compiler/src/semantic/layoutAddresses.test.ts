import { describe, expect, it } from 'vitest';

import {
	alignAbsoluteWordOffset,
	getAbsoluteWordOffset,
	getByteAddressFromWordOffset,
	getEndByteAddress,
	getModuleEndByteAddress,
} from './layoutAddresses';

describe('layoutAddresses', () => {
	it('converts word offsets to byte addresses', () => {
		expect(getByteAddressFromWordOffset(16, 3)).toBe(28);
	});

	it('calculates end byte addresses', () => {
		expect(getEndByteAddress(24, 5)).toBe(40);
	});

	it('returns byteAddress unchanged when wordAlignedSize is 0', () => {
		expect(getEndByteAddress(24, 0)).toBe(24);
	});

	it('returns byteAddress unchanged when wordAlignedSize is negative', () => {
		expect(getEndByteAddress(24, -1)).toBe(24);
	});

	it('calculates module end byte addresses from module start', () => {
		expect(getModuleEndByteAddress(24, 5)).toBe(40);
	});

	it('calculates absolute word offsets from module start and local offset', () => {
		expect(getAbsoluteWordOffset(16, 3)).toBe(7);
	});

	it('aligns 64-bit values to even word offsets only when needed', () => {
		expect(alignAbsoluteWordOffset(5, 8)).toBe(6);
		expect(alignAbsoluteWordOffset(6, 8)).toBe(6);
		expect(alignAbsoluteWordOffset(5, 4)).toBe(5);
	});
});
