import { describe, expect, test } from 'vitest';

import { createCompiledModule } from './initialMemoryDataSegmentsTestUtils';

describe('initialMemoryDataSegmentsTestUtils', () => {
	test('derives compiled module word-aligned address from byte address by default', () => {
		expect(createCompiledModule({ byteAddress: 12 }).wordAlignedAddress).toBe(3);
	});

	test('keeps explicit compiled module word-aligned address overrides', () => {
		expect(
			createCompiledModule({
				byteAddress: 12,
				wordAlignedAddress: 8,
			}).wordAlignedAddress
		).toBe(8);
	});
});
