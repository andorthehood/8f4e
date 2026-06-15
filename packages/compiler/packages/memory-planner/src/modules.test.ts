import { describe, expect, it } from 'vitest';
import { advanceModuleByteAddress, createModuleAddressCursor, getNextModuleByteAddress } from './modules';

describe('module address planner', () => {
	it('advances module addresses independently per memory index', () => {
		const cursor = createModuleAddressCursor(4);

		const firstDefaultModule = getNextModuleByteAddress(cursor, 0, 4);
		advanceModuleByteAddress(cursor, 0, firstDefaultModule, 3);

		const firstCustomModule = getNextModuleByteAddress(cursor, 1, 4);
		advanceModuleByteAddress(cursor, 1, firstCustomModule, 2);

		expect(firstDefaultModule).toBe(4);
		expect(firstCustomModule).toBe(4);
		expect(getNextModuleByteAddress(cursor, 0, 4)).toBe(16);
		expect(getNextModuleByteAddress(cursor, 1, 4)).toBe(12);
	});
});
