import writeDefaultValue from './writeDefaultValue';

import type { InitialMemoryDataSegmentCandidate } from './types';
import type { DataStructure } from '@8f4e/compiler-types';

export default function createMemoryDataSegmentCandidate(memory: DataStructure): InitialMemoryDataSegmentCandidate {
	const isArray = memory.numberOfElements > 1 && typeof memory.default === 'object';
	const bytes = new Uint8Array(isArray ? memory.numberOfElements * memory.elementWordSize : memory.elementWordSize);
	const view = new DataView(bytes.buffer);

	if (isArray && typeof memory.default === 'object') {
		for (const [elementIndex, value] of Object.entries(memory.default)) {
			writeDefaultValue(view, memory, parseInt(elementIndex, 10) * memory.elementWordSize, value);
		}
	} else if (typeof memory.default === 'number') {
		writeDefaultValue(view, memory, 0, memory.default);
	}

	return {
		byteAddress: memory.byteAddress,
		bytes,
		sourceKind: isArray ? 'array' : 'scalar',
	};
}
