import { describe, expect, test } from 'vitest';

import mergeAdjacentInitialMemoryDataSegments from './mergeAdjacentInitialMemoryDataSegments';

import { serializeSegments } from '../../tests/initialMemoryDataSegmentsTestUtils';

describe('mergeAdjacentInitialMemoryDataSegments', () => {
	test('sorts segments and merges adjacent ranges with small zero gaps', () => {
		const segments = mergeAdjacentInitialMemoryDataSegments([
			{ memoryIndex: 0, byteAddress: 8, bytes: new Uint8Array([3]) },
			{ memoryIndex: 0, byteAddress: 0, bytes: new Uint8Array([1, 2]) },
			{ memoryIndex: 0, byteAddress: 2, bytes: new Uint8Array([4]) },
		]);

		expect(serializeSegments(segments)).toEqual([
			{
				memoryIndex: 0,
				byteAddress: 0,
				bytes: [1, 2, 4, 0, 0, 0, 0, 0, 3],
			},
		]);
	});

	test('merges across zero gaps up to 32 bytes', () => {
		const segments = mergeAdjacentInitialMemoryDataSegments([
			{ memoryIndex: 0, byteAddress: 0, bytes: new Uint8Array([1]) },
			{ memoryIndex: 0, byteAddress: 33, bytes: new Uint8Array([2]) },
		]);

		expect(serializeSegments(segments)).toEqual([
			{
				memoryIndex: 0,
				byteAddress: 0,
				bytes: [1, ...new Array(32).fill(0), 2],
			},
		]);
	});

	test('keeps ranges separate when the zero gap is larger than 32 bytes', () => {
		const segments = mergeAdjacentInitialMemoryDataSegments([
			{ memoryIndex: 0, byteAddress: 0, bytes: new Uint8Array([1]) },
			{ memoryIndex: 0, byteAddress: 34, bytes: new Uint8Array([2]) },
		]);

		expect(serializeSegments(segments)).toEqual([
			{
				memoryIndex: 0,
				byteAddress: 0,
				bytes: [1],
			},
			{
				memoryIndex: 0,
				byteAddress: 34,
				bytes: [2],
			},
		]);
	});

	test('does not merge adjacent ranges from different memory indices', () => {
		const segments = mergeAdjacentInitialMemoryDataSegments([
			{ memoryIndex: 0, byteAddress: 0, bytes: new Uint8Array([1]) },
			{ memoryIndex: 1, byteAddress: 1, bytes: new Uint8Array([2]) },
		]);

		expect(serializeSegments(segments)).toEqual([
			{
				memoryIndex: 0,
				byteAddress: 0,
				bytes: [1],
			},
			{
				memoryIndex: 1,
				byteAddress: 1,
				bytes: [2],
			},
		]);
	});

	test('sorts segments by memory index before byte address', () => {
		const segments = mergeAdjacentInitialMemoryDataSegments([
			{ memoryIndex: 1, byteAddress: 0, bytes: new Uint8Array([3]) },
			{ memoryIndex: 0, byteAddress: 100, bytes: new Uint8Array([1]) },
			{ memoryIndex: 0, byteAddress: 0, bytes: new Uint8Array([2]) },
		]);

		expect(serializeSegments(segments)).toEqual([
			{
				memoryIndex: 0,
				byteAddress: 0,
				bytes: [2],
			},
			{
				memoryIndex: 0,
				byteAddress: 100,
				bytes: [1],
			},
			{
				memoryIndex: 1,
				byteAddress: 0,
				bytes: [3],
			},
		]);
	});

	test('copies segment bytes so callers cannot mutate retained inputs', () => {
		const inputBytes = new Uint8Array([1]);
		const [segment] = mergeAdjacentInitialMemoryDataSegments([{ memoryIndex: 0, byteAddress: 0, bytes: inputBytes }]);

		inputBytes[0] = 2;

		expect(Array.from(segment.bytes)).toEqual([1]);
	});
});
