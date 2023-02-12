import { MemoryBuffer } from '@8f4e/compiler';

import { Event } from './midiEnums';
import { MidiModuleAddresses } from './types';

const wasOn = new Map<string, boolean>();
const sampleAndHold = new Map<string, number>();

export default function (midiNoteModules: MidiModuleAddresses[], memoryBuffer: MemoryBuffer): void {
	midiNoteModules.forEach(({ noteAddress, noteOnOffAddress, channelAddress, velocityAddress, moduleId }) => {
		const note = memoryBuffer[noteAddress];
		const isOn = memoryBuffer[noteOnOffAddress] !== 0;
		const channel = memoryBuffer[channelAddress] || 1;
		const velocity = memoryBuffer[velocityAddress];

		if (isOn && !wasOn.get(moduleId)) {
			sampleAndHold.set(moduleId, note);
			self.postMessage({
				type: 'midiMessage',
				payload: {
					message: [Event.NOTE_ON + channel - 1, note, velocity],
				},
			});
		} else if (!isOn && wasOn.get(moduleId)) {
			self.postMessage({
				type: 'midiMessage',
				payload: {
					message: [Event.NOTE_OFF + channel - 1, sampleAndHold.get(moduleId), velocity],
				},
			});
		}

		wasOn.set(moduleId, isOn);
	});
}
