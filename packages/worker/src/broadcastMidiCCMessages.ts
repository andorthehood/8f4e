import { I16_SIGNED_LARGEST_NUMBER, MemoryBuffer } from '@8f4e/compiler';

import { Event } from './midiEnums';
import { MidiCCModuleAddresses } from './types';

const previousValues = new Map<string, number>();

export default function (midiNoteModules: MidiCCModuleAddresses[], memoryBuffer: MemoryBuffer): void {
	midiNoteModules.forEach(({ channelAddress, selectedCCAddress, valueAddress, moduleId }) => {
		const cc = memoryBuffer[selectedCCAddress];
		const channel = memoryBuffer[channelAddress] || 1;
		const value = Math.floor((memoryBuffer[valueAddress] / I16_SIGNED_LARGEST_NUMBER + 1) * 63.5);

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
