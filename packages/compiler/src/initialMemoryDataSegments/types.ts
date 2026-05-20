export interface InitialMemoryDataSegment {
	memoryIndex: number;
	memoryRegionName?: string;
	byteAddress: number;
	bytes: Uint8Array;
}

export interface InitialMemoryDataSegmentCandidate extends InitialMemoryDataSegment {
	sourceKind: 'scalar' | 'array' | 'internal-resource';
}
