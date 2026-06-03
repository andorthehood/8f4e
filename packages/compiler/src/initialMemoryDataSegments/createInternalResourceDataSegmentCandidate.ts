import type { InternalResource } from '@8f4e/compiler-spec';

import type { InitialMemoryDataSegmentCandidate } from './types';
import writeInternalResourceDefault from './writeInternalResourceDefault';

/** Creates an initial data segment candidate for a non-zero internal resource default. */
export default function createInternalResourceDataSegmentCandidate(
	resource: InternalResource
): InitialMemoryDataSegmentCandidate | undefined {
	if (resource.default === 0) {
		return undefined;
	}

	const bytes = new Uint8Array(resource.elementWordSize);
	const view = new DataView(bytes.buffer);
	writeInternalResourceDefault(view, {
		...resource,
		byteAddress: 0,
	});

	return {
		memoryIndex: resource.memoryIndex,
		...(resource.memoryRegionName ? { memoryRegionName: resource.memoryRegionName } : {}),
		byteAddress: resource.byteAddress,
		bytes,
		sourceKind: 'internal-resource',
	};
}
