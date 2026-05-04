import writeDefaultValue from './writeDefaultValue';

import type { InitialMemoryDataSegmentCandidate } from './types';
import type { DataStructure } from '@8f4e/compiler-types';

export default function createMemoryDataSegmentCandidate(memory: DataStructure): InitialMemoryDataSegmentCandidate[] {
	const isArray = memory.numberOfElements > 1;
	if (isArray && memory.hasExplicitDefault !== true) {
		return [];
	}
	if (!isArray && memory.hasExplicitDefault !== true && memory.default === 0) {
		return [];
	}

	if (isArray) {
		return createArrayDataSegmentCandidates(memory);
	}

	const bytes = createDefaultValueBytes(memory, memory.default as number);
	return [
		{
			byteAddress: memory.byteAddress,
			bytes,
			sourceKind: 'scalar',
		},
	];
}

function createArrayDataSegmentCandidates(memory: DataStructure): InitialMemoryDataSegmentCandidate[] {
	return Object.entries(memory.default as Record<string, number>)
		.sort(([leftIndex], [rightIndex]) => parseInt(leftIndex, 10) - parseInt(rightIndex, 10))
		.reduce<InitialMemoryDataSegmentCandidate[]>((segments, [elementIndex, value]) => {
			const bytes = createDefaultValueBytes(memory, value);
			if (bytes.every(byte => byte === 0)) {
				return segments;
			}

			const byteAddress = memory.byteAddress + parseInt(elementIndex, 10) * memory.elementWordSize;
			const previousSegment = segments.at(-1);
			if (!previousSegment || previousSegment.byteAddress + previousSegment.bytes.length !== byteAddress) {
				segments.push({
					byteAddress,
					bytes,
					sourceKind: 'array',
				});
				return segments;
			}

			const mergedBytes = new Uint8Array(previousSegment.bytes.length + bytes.length);
			mergedBytes.set(previousSegment.bytes, 0);
			mergedBytes.set(bytes, previousSegment.bytes.length);
			previousSegment.bytes = mergedBytes;

			return segments;
		}, []);
}

function createDefaultValueBytes(memory: DataStructure, value: number): Uint8Array {
	const bytes = new Uint8Array(memory.elementWordSize);
	const view = new DataView(bytes.buffer);
	writeDefaultValue(view, memory, 0, value);

	return bytes;
}
