import { describe, expect, test } from 'vitest';

import mergeAdjacentInitialMemoryDataSegments from './mergeAdjacentInitialMemoryDataSegments';

import { serializeSegments } from '../../tests/initialMemoryDataSegmentsTestUtils';

describe('mergeAdjacentInitialMemoryDataSegments', () => {
	test('sorts segments and merges only adjacent ranges', () => {
		const segments = mergeAdjacentInitialMemoryDataSegments([
			{ byteAddress: 8, bytes: new Uint8Array([3]) },
			{ byteAddress: 0, bytes: new Uint8Array([1, 2]) },
			{ byteAddress: 2, bytes: new Uint8Array([4]) },
		]);

		expect(serializeSegments(segments)).toEqual([
			{
				byteAddress: 0,
				bytes: [1, 2, 4],
			},
			{
				byteAddress: 8,
				bytes: [3],
			},
		]);
	});

	test('copies segment bytes so callers cannot mutate retained inputs', () => {
		const inputBytes = new Uint8Array([1]);
		const [segment] = mergeAdjacentInitialMemoryDataSegments([{ byteAddress: 0, bytes: inputBytes }]);

		inputBytes[0] = 2;

		expect(Array.from(segment.bytes)).toEqual([1]);
	});
});
