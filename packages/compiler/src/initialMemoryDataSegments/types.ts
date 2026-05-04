export interface InitialMemoryDataSegment {
	byteAddress: number;
	bytes: Uint8Array;
}

export interface InitialMemoryDataSegmentCandidate extends InitialMemoryDataSegment {
	sourceKind: 'scalar' | 'array' | 'internal-resource';
}
