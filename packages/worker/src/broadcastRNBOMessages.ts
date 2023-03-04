import { MemoryBuffer } from '@8f4e/compiler';

import { MaxModule } from './types';

export default function (maxModules: MaxModule[], memoryBuffer: MemoryBuffer): void {
	maxModules.forEach(({ paramAdresses }) => {
		self.postMessage({
			type: 'RNBOMessage',
			payload: {
				params: paramAdresses.map(paramAddress => memoryBuffer[paramAddress]),
			},
		});
	});
}
