import { describe, expect, test } from 'vitest';

import writeInternalResourceDefault from './writeInternalResourceDefault';

import type { InternalResource } from '@8f4e/compiler-types';

function createResource(
	overrides: Pick<InternalResource, 'byteAddress' | 'default' | 'storageType'>
): InternalResource {
	return {
		id: 'resource',
		wordAlignedAddress: 0,
		wordAlignedSize: 1,
		elementWordSize: overrides.storageType === 'float64' ? 8 : 4,
		...overrides,
	};
}

describe('writeInternalResourceDefault', () => {
	test('writes int resources as truncated i32 values', () => {
		const view = new DataView(new Uint8Array(4).buffer);

		writeInternalResourceDefault(view, createResource({ byteAddress: 0, default: 2.9, storageType: 'int' }));

		expect(view.getInt32(0, true)).toBe(2);
	});

	test('writes float and float64 resources', () => {
		const view = new DataView(new Uint8Array(12).buffer);

		writeInternalResourceDefault(view, createResource({ byteAddress: 0, default: 1.5, storageType: 'float' }));
		writeInternalResourceDefault(view, createResource({ byteAddress: 4, default: Math.PI, storageType: 'float64' }));

		expect(view.getFloat32(0, true)).toBe(1.5);
		expect(view.getFloat64(4, true)).toBe(Math.PI);
	});
});
