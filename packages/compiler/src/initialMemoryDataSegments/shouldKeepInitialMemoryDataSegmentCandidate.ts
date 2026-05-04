import isAllZeroBytes from './isAllZeroBytes';

import type { InitialMemoryDataSegmentCandidate } from './types';

export default function shouldKeepInitialMemoryDataSegmentCandidate(
	candidate: InitialMemoryDataSegmentCandidate
): boolean {
	if (candidate.sourceKind === 'array') {
		return !isAllZeroBytes(candidate.bytes);
	}

	return true;
}
