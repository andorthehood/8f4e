import type { InitialMemoryDataSegment } from './types';

export default function mergeAdjacentInitialMemoryDataSegments(
	segments: InitialMemoryDataSegment[]
): InitialMemoryDataSegment[] {
	return [...segments]
		.sort((left, right) => left.byteAddress - right.byteAddress)
		.reduce<InitialMemoryDataSegment[]>((mergedSegments, segment) => {
			const previousSegment = mergedSegments.at(-1);

			if (!previousSegment || previousSegment.byteAddress + previousSegment.bytes.length !== segment.byteAddress) {
				mergedSegments.push({
					byteAddress: segment.byteAddress,
					bytes: segment.bytes.slice(),
				});
				return mergedSegments;
			}

			const mergedBytes = new Uint8Array(previousSegment.bytes.length + segment.bytes.length);
			mergedBytes.set(previousSegment.bytes, 0);
			mergedBytes.set(segment.bytes, previousSegment.bytes.length);
			previousSegment.bytes = mergedBytes;

			return mergedSegments;
		}, []);
}
