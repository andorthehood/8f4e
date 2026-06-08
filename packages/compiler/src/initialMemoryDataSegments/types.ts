/** Passive data segment used to initialize one WebAssembly memory at instantiation time. */
export interface InitialMemoryDataSegment {
	memoryIndex: number;
	memoryRegionName?: string;
	byteAddress: number;
	bytes: Uint8Array;
}

/** Initial memory data segment candidate tagged with the compiler source that produced it. */
export interface InitialMemoryDataSegmentCandidate extends InitialMemoryDataSegment {
	sourceKind: 'scalar' | 'array';
}
