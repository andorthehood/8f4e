import { describe, expect, test } from 'vitest';

import createMemoryDataSegmentCandidate from './createMemoryDataSegmentCandidate';

import { createMemory } from '../../tests/initialMemoryDataSegmentsTestUtils';

describe('createMemoryDataSegmentCandidate', () => {
	test('creates scalar candidates with encoded default bytes', () => {
		const candidate = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'scalar',
				byteAddress: 12,
				default: 2.9,
			})
		);

		expect(candidate?.byteAddress).toBe(12);
		expect(candidate?.sourceKind).toBe('scalar');
		expect(Array.from(candidate?.bytes ?? [])).toEqual([2, 0, 0, 0]);
	});

	test('creates explicit array candidates with sparse initializer defaults encoded in place', () => {
		const candidate = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'array',
				byteAddress: 16,
				numberOfElements: 3,
				hasExplicitDefault: true,
				default: {
					1: 2,
				},
			})
		);

		expect(candidate?.byteAddress).toBe(16);
		expect(candidate?.sourceKind).toBe('array');
		expect(Array.from(candidate?.bytes ?? [])).toEqual([0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0]);
	});

	test('skips implicit zero-filled arrays', () => {
		const candidate = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'array',
				byteAddress: 16,
				numberOfElements: 3,
				default: {},
			})
		);

		expect(candidate).toBeUndefined();
	});

	test('skips implicit zero scalar candidates', () => {
		const candidate = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'scalar',
				byteAddress: 12,
				default: 0,
			})
		);

		expect(candidate).toBeUndefined();
	});

	test('creates explicit zero scalar candidates', () => {
		const candidate = createMemoryDataSegmentCandidate(
			createMemory({
				id: 'scalar',
				byteAddress: 12,
				hasExplicitDefault: true,
				default: 0,
			})
		);

		expect(candidate?.byteAddress).toBe(12);
		expect(candidate?.sourceKind).toBe('scalar');
		expect(Array.from(candidate?.bytes ?? [])).toEqual([0, 0, 0, 0]);
	});

	test('creates explicit zero-filled array candidates', () => {
		const candidate = createMemoryDataSegmentCandidate(
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

		expect(candidate?.sourceKind).toBe('array');
		expect(Array.from(candidate?.bytes ?? [])).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
	});
});
