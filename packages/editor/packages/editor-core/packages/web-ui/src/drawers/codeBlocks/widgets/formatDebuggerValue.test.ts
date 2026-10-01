import type { PlannedMemoryDeclaration } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import formatDebuggerValue, { formatDebuggerValueAtAddress } from './formatDebuggerValue';

function createMemoryViews() {
	const buffer = new ArrayBuffer(8);

	return {
		uint8: new Uint8Array(buffer),
		int8: new Int8Array(buffer),
		uint16: new Uint16Array(buffer),
		int16: new Int16Array(buffer),
		int32: new Int32Array(buffer),
		float32: new Float32Array(buffer),
		float64: new Float64Array(buffer),
	};
}

function createMemory(overrides: Partial<PlannedMemoryDeclaration>): PlannedMemoryDeclaration {
	return {
		id: 'value',
		type: 'int',
		byteAddress: 0,
		wordAlignedAddress: 0,
		wordAlignedSize: 1,
		elementWordSize: 4,
		isInteger: true,
		isUnsigned: false,
		isPointer: false,
		...overrides,
	};
}

describe('formatDebuggerValue', () => {
	it('renders 32-bit hex values as separate bytes in big-endian display order', () => {
		const memoryViews = createMemoryViews();
		memoryViews.uint8.set([0xff, 0xa8, 0x00, 0x00]);

		expect(formatDebuggerValue(memoryViews, createMemory({ elementWordSize: 4 }), 0, 'hex')).toBe('00 00 a8 ff');
	});

	it('preserves leading zero bytes for 16-bit hex values', () => {
		const memoryViews = createMemoryViews();
		memoryViews.uint8.set([0x0f, 0x00]);

		expect(formatDebuggerValue(memoryViews, createMemory({ elementWordSize: 2, wordAlignedSize: 0.5 }), 0, 'hex')).toBe(
			'00 0f'
		);
	});

	it('formats single-byte hex values as a padded byte', () => {
		const memoryViews = createMemoryViews();
		memoryViews.uint8[0] = 0x0a;

		expect(
			formatDebuggerValue(memoryViews, createMemory({ elementWordSize: 1, wordAlignedSize: 0.25 }), 0, 'hex')
		).toBe('0a');
	});

	it('renders an invalid marker for a negative dereferenced byte address', () => {
		const memoryViews = createMemoryViews();

		expect(
			formatDebuggerValueAtAddress(
				memoryViews,
				-1,
				-0.25,
				{ elementWordSize: 1, isInteger: true, isUnsigned: true },
				'decimal'
			)
		).toBe('?');
	});

	it('renders an invalid marker for an out-of-range watch index', () => {
		const memoryViews = createMemoryViews();

		expect(formatDebuggerValue(memoryViews, createMemory({ elementWordSize: 4 }), 2, 'decimal')).toBe('?');
	});

	it('renders an invalid marker for misaligned and truncated values', () => {
		const memoryViews = createMemoryViews();

		expect(
			formatDebuggerValueAtAddress(
				memoryViews,
				1,
				0,
				{ elementWordSize: 2, isInteger: true, isUnsigned: false },
				'decimal'
			)
		).toBe('?');
		expect(
			formatDebuggerValueAtAddress(
				memoryViews,
				4,
				1,
				{ elementWordSize: 8, isInteger: false, isUnsigned: false },
				'hex'
			)
		).toBe('?');
	});
});
