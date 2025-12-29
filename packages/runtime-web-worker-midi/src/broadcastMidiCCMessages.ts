import { Event } from './midiEnums';

import type { MemoryBuffer } from '@8f4e/compiler';
import type { MidiCCModuleAddresses } from './types';

const previousValues = new Map<string, number>();

export default function (midiNoteModules: MidiCCModuleAddresses[], memoryBuffer: MemoryBuffer): void {
	midiNoteModules.forEach(({ channelWordAddress, selectedCCWordAddress, valueWordAddress, moduleId }) => {
		if (!selectedCCWordAddress || !valueWordAddress) {
			return;
		}

		const cc = memoryBuffer[selectedCCWordAddress];
		const channel = channelWordAddress ? memoryBuffer[channelWordAddress] || 1 : 1;
		const value = memoryBuffer[valueWordAddress];

		if (previousValues.get(moduleId) !== value) {
			self.postMessage({
				type: 'midiMessage',
				payload: {
					message: [Event.CONTROL_CHANGE + channel - 1, cc, value],
				},
			});

			previousValues.set(moduleId, value);
		}
	});
}
