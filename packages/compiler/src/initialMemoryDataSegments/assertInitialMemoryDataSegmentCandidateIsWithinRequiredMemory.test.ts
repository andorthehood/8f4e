import { describe, expect, test } from 'vitest';

import assertInitialMemoryDataSegmentCandidateIsWithinRequiredMemory from './assertInitialMemoryDataSegmentCandidateIsWithinRequiredMemory';

import { createCandidate } from '../../tests/initialMemoryDataSegmentsTestUtils';

describe('assertInitialMemoryDataSegmentCandidateIsWithinRequiredMemory', () => {
	test('allows candidates ending at the required memory boundary', () => {
		expect(() =>
			assertInitialMemoryDataSegmentCandidateIsWithinRequiredMemory(
				createCandidate({ byteAddress: 4, bytes: new Uint8Array(4) }),
				8
			)
		).not.toThrow();
	});

	test('rejects candidates that exceed required memory', () => {
		expect(() =>
			assertInitialMemoryDataSegmentCandidateIsWithinRequiredMemory(
				createCandidate({ byteAddress: 5, bytes: new Uint8Array(4) }),
				8
			)
		).toThrow(RangeError);
	});
});
