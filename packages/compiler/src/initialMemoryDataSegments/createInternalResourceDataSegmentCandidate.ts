import writeInternalResourceDefault from './writeInternalResourceDefault';

import type { InitialMemoryDataSegmentCandidate } from './types';
import type { InternalResource } from '@8f4e/compiler-types';

export default function createInternalResourceDataSegmentCandidate(
	resource: InternalResource
): InitialMemoryDataSegmentCandidate {
	const bytes = new Uint8Array(resource.elementWordSize);
	const view = new DataView(bytes.buffer);
	writeInternalResourceDefault(view, {
		...resource,
		byteAddress: 0,
	});

	return {
		byteAddress: resource.byteAddress,
		bytes,
		sourceKind: 'internal-resource',
	};
}
