import writeDefaultValue from './writeDefaultValue';

import type { InitialMemoryDataSegmentCandidate } from './types';
import type { DataStructure } from '@8f4e/compiler-types';

export default function createMemoryDataSegmentCandidate(
	memory: DataStructure
): InitialMemoryDataSegmentCandidate | undefined {
	const isArray = memory.numberOfElements > 1;
	if (isArray && memory.hasExplicitDefault !== true) {
		return undefined;
	}
	if (!isArray && memory.hasExplicitDefault !== true && memory.default === 0) {
		return undefined;
	}

	const bytes = new Uint8Array(isArray ? memory.numberOfElements * memory.elementWordSize : memory.elementWordSize);
	const view = new DataView(bytes.buffer);

	if (isArray) {
		for (const [elementIndex, value] of Object.entries(memory.default as Record<string, number>)) {
			writeDefaultValue(view, memory, parseInt(elementIndex, 10) * memory.elementWordSize, value);
		}
	} else {
		writeDefaultValue(view, memory, 0, memory.default as number);
	}

	return {
		byteAddress: memory.byteAddress,
		bytes,
		sourceKind: isArray ? 'array' : 'scalar',
	};
}
