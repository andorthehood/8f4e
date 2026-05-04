import type { InitialMemoryDataSegment } from './types';

export const MAX_ZERO_GAP_BYTES_TO_MERGE = 32;

export default function mergeAdjacentInitialMemoryDataSegments(
	segments: InitialMemoryDataSegment[]
): InitialMemoryDataSegment[] {
	return [...segments]
		.sort((left, right) => left.byteAddress - right.byteAddress)
		.reduce<InitialMemoryDataSegment[]>((mergedSegments, segment) => {
			const previousSegment = mergedSegments.at(-1);
			const previousSegmentEnd = previousSegment
				? previousSegment.byteAddress + previousSegment.bytes.length
				: undefined;
			const gapByteLength = previousSegmentEnd === undefined ? 0 : segment.byteAddress - previousSegmentEnd;

			if (!previousSegment || gapByteLength > MAX_ZERO_GAP_BYTES_TO_MERGE) {
				mergedSegments.push({
					byteAddress: segment.byteAddress,
					bytes: segment.bytes.slice(),
				});
				return mergedSegments;
			}

			const mergedBytes = new Uint8Array(previousSegment.bytes.length + gapByteLength + segment.bytes.length);
			mergedBytes.set(previousSegment.bytes, 0);
			mergedBytes.set(segment.bytes, previousSegment.bytes.length + gapByteLength);
			previousSegment.bytes = mergedBytes;

			return mergedSegments;
		}, []);
}
