import { describe, expect, test } from 'vitest';

import createMemoryDataSegmentCandidate from './createMemoryDataSegmentCandidate';
import { createMemory, createMemoryDefault } from './testUtils';

describe('createMemoryDataSegmentCandidate', () => {
	test('creates scalar candidates with encoded default bytes', () => {
		const candidates = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'scalar',
				byteAddress: 12,
			}),
			createMemoryDefault(2.9)
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
			}),
			createMemoryDefault(
				{
					0: 1,
					1: 2,
					2: 0,
					3: 4,
				},
				{ hasExplicitDefault: true }
			)
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
			}),
			createMemoryDefault(
				{
					0: 1,
				},
				{ hasExplicitDefault: true }
			)
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
			}),
			createMemoryDefault({})
		);

		expect(candidates).toEqual([]);
	});

	test('skips implicit zero scalar candidates', () => {
		const candidates = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'scalar',
				byteAddress: 12,
			}),
			createMemoryDefault(0)
		);

		expect(candidates).toEqual([]);
	});

	test('creates explicit zero scalar candidates', () => {
		const candidates = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'scalar',
				byteAddress: 12,
			}),
			createMemoryDefault(0, { hasExplicitDefault: true })
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
			}),
			createMemoryDefault(
				{
					0: 0,
				},
				{ hasExplicitDefault: true }
			)
		);

		expect(candidates).toEqual([]);
	});
});
