import { I16_SIGNED_LARGEST_NUMBER, MemoryBuffer } from '@8f4e/compiler';

import { int16ToMidiNote } from './midiHelpers';
import { Event } from './midiEnums';
import { MidiModuleAddresses } from './types';

const wasOn = new Map<string, boolean>();
const sampleAndHold = new Map<string, number>();

export default function (midiNoteModules: MidiModuleAddresses[], memoryBuffer: MemoryBuffer): void {
	midiNoteModules.forEach(({ noteAddress, noteOnOffAddress, channelAddress, velocityAddress, moduleId }) => {
		const note = int16ToMidiNote(memoryBuffer[noteAddress]);
		const isOn = memoryBuffer[noteOnOffAddress] !== 0;
		const channel = memoryBuffer[channelAddress] || 1;
		const velocity = Math.round((memoryBuffer[velocityAddress] / I16_SIGNED_LARGEST_NUMBER + 1) * 50) || 127;

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
