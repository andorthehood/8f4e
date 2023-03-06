import { MemoryBuffer } from '@8f4e/compiler';

import { RNBOModule } from './types';

export default function (maxModules: RNBOModule[], memoryBuffer: MemoryBuffer): void {
	maxModules.forEach(({ paramAdresses, patcherId }) => {
		self.postMessage({
			type: 'RNBOMessage',
			payload: {
				patcherId,
				params: paramAdresses.map(paramAddress => memoryBuffer[paramAddress]),
			},
		});
	});
}
