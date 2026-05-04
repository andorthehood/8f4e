import type { InitialMemoryDataSegmentCandidate } from './types';

export default function assertInitialMemoryDataSegmentCandidateIsWithinRequiredMemory(
	candidate: InitialMemoryDataSegmentCandidate,
	requiredMemoryBytes: number
) {
	if (candidate.byteAddress + candidate.bytes.length > requiredMemoryBytes) {
		throw new RangeError(
			`Initial memory data segment at byte ${candidate.byteAddress} exceeds required memory size ${requiredMemoryBytes}`
		);
	}
}
