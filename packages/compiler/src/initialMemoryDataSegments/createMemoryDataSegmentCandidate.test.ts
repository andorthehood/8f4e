import { describe, expect, test } from 'vitest';

import createMemoryDataSegmentCandidate from './createMemoryDataSegmentCandidate';

import { createMemory } from '../../tests/initialMemoryDataSegmentsTestUtils';

describe('createMemoryDataSegmentCandidate', () => {
	test('creates scalar candidates with encoded default bytes', () => {
		const candidates = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'scalar',
				byteAddress: 12,
				default: 2.9,
			})
		);
		const [candidate] = candidates;

		expect(candidate?.byteAddress).toBe(12);
		expect(candidate?.sourceKind).toBe('scalar');
		expect(Array.from(candidate?.bytes ?? [])).toEqual([2, 0, 0, 0]);
	});

	test('creates explicit array candidates only for non-zero initializer runs', () => {
		const candidates = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'array',
				byteAddress: 16,
				numberOfElements: 4,
				hasExplicitDefault: true,
				default: {
					0: 1,
					1: 2,
					2: 0,
					3: 4,
				},
			})
		);

		expect(
			candidates.map(candidate => ({
				byteAddress: candidate.byteAddress,
				bytes: Array.from(candidate.bytes),
				sourceKind: candidate.sourceKind,
			}))
		).toEqual([
			{
				byteAddress: 16,
				bytes: [1, 0, 0, 0, 2, 0, 0, 0],
				sourceKind: 'array',
			},
			{
				byteAddress: 28,
				bytes: [4, 0, 0, 0],
				sourceKind: 'array',
			},
		]);
	});

	test('does not create a full byte image for large sparse array initializers', () => {
		const candidates = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'array',
				byteAddress: 16,
				numberOfElements: 1_000_000,
				hasExplicitDefault: true,
				default: {
					0: 1,
				},
			})
		);

		expect(candidates).toHaveLength(1);
		expect(candidates[0].byteAddress).toBe(16);
		expect(Array.from(candidates[0].bytes)).toEqual([1, 0, 0, 0]);
	});

	test('skips implicit zero-filled arrays', () => {
		const candidates = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'array',
				byteAddress: 16,
				numberOfElements: 3,
				default: {},
			})
		);

		expect(candidates).toEqual([]);
	});

	test('skips implicit zero scalar candidates', () => {
		const candidates = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'scalar',
				byteAddress: 12,
				default: 0,
			})
		);

		expect(candidates).toEqual([]);
	});

	test('creates explicit zero scalar candidates', () => {
		const candidates = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'scalar',
				byteAddress: 12,
				hasExplicitDefault: true,
				default: 0,
			})
		);
		const [candidate] = candidates;

		expect(candidate?.byteAddress).toBe(12);
		expect(candidate?.sourceKind).toBe('scalar');
		expect(Array.from(candidate?.bytes ?? [])).toEqual([0, 0, 0, 0]);
	});

	test('skips explicit zero-filled array candidates', () => {
		const candidates = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'array',
				byteAddress: 16,
				numberOfElements: 3,
				hasExplicitDefault: true,
				default: {
					0: 0,
				},
			})
		);

		expect(candidates).toEqual([]);
	});
});
