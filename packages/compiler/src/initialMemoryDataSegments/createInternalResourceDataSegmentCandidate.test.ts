import { describe, expect, test } from 'vitest';

import createInternalResourceDataSegmentCandidate from './createInternalResourceDataSegmentCandidate';

import { createInternalResource } from '../../tests/initialMemoryDataSegmentsTestUtils';

describe('createInternalResourceDataSegmentCandidate', () => {
	test('creates internal resource candidates using relative payload offsets', () => {
		const candidate = createInternalResourceDataSegmentCandidate(
			createInternalResource({
				id: 'resource',
				byteAddress: 32,
				default: 3.8,
			})
		);

		expect(candidate.byteAddress).toBe(32);
		expect(candidate.sourceKind).toBe('internal-resource');
		expect(Array.from(candidate.bytes)).toEqual([3, 0, 0, 0]);
	});
});
