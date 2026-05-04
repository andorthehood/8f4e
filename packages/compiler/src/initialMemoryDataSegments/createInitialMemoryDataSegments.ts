import createInternalResourceDataSegmentCandidate from './createInternalResourceDataSegmentCandidate';
import createMemoryDataSegmentCandidate from './createMemoryDataSegmentCandidate';
import mergeAdjacentInitialMemoryDataSegments from './mergeAdjacentInitialMemoryDataSegments';

import type { InitialMemoryDataSegment } from './types';
import type { CompiledModule } from '@8f4e/compiler-types';

export default function createInitialMemoryDataSegments(compiledModules: CompiledModule[]): InitialMemoryDataSegment[] {
	const segmentCandidates = compiledModules.flatMap(module => [
		...Object.values(module.memoryMap).flatMap(memory => {
			const candidate = createMemoryDataSegmentCandidate(memory);
			return candidate ? [candidate] : [];
		}),
		...Object.values(module.internalResources ?? {}).flatMap(resource => {
			const candidate = createInternalResourceDataSegmentCandidate(resource);
			return candidate ? [candidate] : [];
		}),
	]);

	return mergeAdjacentInitialMemoryDataSegments(segmentCandidates);
}
