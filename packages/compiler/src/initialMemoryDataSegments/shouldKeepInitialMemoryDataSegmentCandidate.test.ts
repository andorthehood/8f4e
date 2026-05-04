import { describe, expect, test } from 'vitest';

import shouldKeepInitialMemoryDataSegmentCandidate from './shouldKeepInitialMemoryDataSegmentCandidate';

import { createCandidate } from '../../tests/initialMemoryDataSegmentsTestUtils';

describe('shouldKeepInitialMemoryDataSegmentCandidate', () => {
	test('skips only all-zero array candidates', () => {
		expect(
			shouldKeepInitialMemoryDataSegmentCandidate(
				createCandidate({ sourceKind: 'array', bytes: new Uint8Array([0, 0]) })
			)
		).toBe(false);
		expect(
			shouldKeepInitialMemoryDataSegmentCandidate(
				createCandidate({ sourceKind: 'array', bytes: new Uint8Array([0, 1]) })
			)
		).toBe(true);
	});

	test('keeps scalar and internal resource candidates even when all bytes are zero', () => {
		expect(
			shouldKeepInitialMemoryDataSegmentCandidate(
				createCandidate({ sourceKind: 'scalar', bytes: new Uint8Array([0, 0]) })
			)
		).toBe(true);
		expect(
			shouldKeepInitialMemoryDataSegmentCandidate(
				createCandidate({ sourceKind: 'internal-resource', bytes: new Uint8Array([0, 0]) })
			)
		).toBe(true);
	});
});
