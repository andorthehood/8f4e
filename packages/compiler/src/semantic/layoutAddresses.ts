import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';

export function getByteAddressFromWordOffset(startingByteAddress: number, wordOffset: number): number {
	return startingByteAddress + wordOffset * GLOBAL_ALIGNMENT_BOUNDARY;
}

export function getEndByteAddress(byteAddress: number, wordAlignedSize: number): number {
	return byteAddress + (wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY;
}

export function getModuleEndByteAddress(startingByteAddress: number, wordAlignedSize: number): number {
	return getEndByteAddress(startingByteAddress, wordAlignedSize);
}

export function getAbsoluteWordOffset(startingByteAddress: number, localWordOffset: number): number {
	return startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + localWordOffset;
}

export function alignAbsoluteWordOffset(absoluteWordOffset: number, elementWordSize: number): number {
	if (elementWordSize !== 8 || absoluteWordOffset % 2 === 0) {
		return absoluteWordOffset;
	}

	return absoluteWordOffset + 1;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('layoutAddresses', () => {
		it('converts word offsets to byte addresses', () => {
			expect(getByteAddressFromWordOffset(16, 3)).toBe(28);
		});

		it('calculates end byte addresses', () => {
			expect(getEndByteAddress(24, 5)).toBe(40);
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
}
