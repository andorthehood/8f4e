import { MemoryBuffer } from '@8f4e/compiler';

import { MaxModule } from './types';

export default function (maxModules: MaxModule[], memoryBuffer: MemoryBuffer): void {
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
