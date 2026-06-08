import type { CompiledModule } from '@8f4e/compiler-spec';
import createMemoryDataSegmentCandidate from './createMemoryDataSegmentCandidate';
import mergeAdjacentInitialMemoryDataSegments from './mergeAdjacentInitialMemoryDataSegments';
import type { InitialMemoryDataSegment } from './types';

/**
 * Creates passive data segments for non-zero and explicitly initialized compiled module memory.
 *
 * @param compiledModules - Compiled modules to inspect for initial memory data.
 * @returns The materialized initial memory data segment data.
 */
export default function createInitialMemoryDataSegments(compiledModules: CompiledModule[]): InitialMemoryDataSegment[] {
	const segmentCandidates = compiledModules.flatMap(module => [
		...Object.values(module.memoryMap).flatMap(memory => createMemoryDataSegmentCandidate(memory)),
	]);

	return mergeAdjacentInitialMemoryDataSegments(segmentCandidates);
}
