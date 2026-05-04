import assertInitialMemoryDataSegmentCandidateIsWithinRequiredMemory from './assertInitialMemoryDataSegmentCandidateIsWithinRequiredMemory';
import createInternalResourceDataSegmentCandidate from './createInternalResourceDataSegmentCandidate';
import createMemoryDataSegmentCandidate from './createMemoryDataSegmentCandidate';
import mergeAdjacentInitialMemoryDataSegments from './mergeAdjacentInitialMemoryDataSegments';
import shouldKeepInitialMemoryDataSegmentCandidate from './shouldKeepInitialMemoryDataSegmentCandidate';

import type { InitialMemoryDataSegment } from './types';
import type { CompiledModule } from '@8f4e/compiler-types';

export default function createInitialMemoryDataSegments(
	compiledModules: CompiledModule[],
	requiredMemoryBytes: number
): InitialMemoryDataSegment[] {
	const segmentCandidates = compiledModules.flatMap(module => [
		...Object.values(module.memoryMap).map(createMemoryDataSegmentCandidate),
		...Object.values(module.internalResources ?? {}).map(createInternalResourceDataSegmentCandidate),
	]);

	const retainedSegments = segmentCandidates.flatMap(candidate => {
		assertInitialMemoryDataSegmentCandidateIsWithinRequiredMemory(candidate, requiredMemoryBytes);
		return shouldKeepInitialMemoryDataSegmentCandidate(candidate)
			? [{ byteAddress: candidate.byteAddress, bytes: candidate.bytes }]
			: [];
	});

	return mergeAdjacentInitialMemoryDataSegments(retainedSegments);
}
