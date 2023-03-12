import { MemoryBuffer } from '@8f4e/compiler';

import { Event } from './midiEnums';
import { MidiModuleAddresses } from './types';

const wasOn = new Map<string, boolean>();
const sampleAndHold = new Map<string, number>();

export default function (midiNoteModules: MidiModuleAddresses[], memoryBuffer: MemoryBuffer): void {
	midiNoteModules.forEach(
		({ noteWordAddress, noteOnOffWordAddress, channelWordAddress, velocityWordAddress, moduleId }) => {
			if (typeof noteWordAddress === 'undefined' || typeof noteOnOffWordAddress === 'undefined') {
				return;
			}

			const note = memoryBuffer[noteWordAddress];
			const isOn = memoryBuffer[noteOnOffWordAddress] !== 0;

			let channel = 1;
			let velocity = 127;

			if (typeof channelWordAddress !== 'undefined') {
				channel = memoryBuffer[channelWordAddress];
			}

			if (typeof velocityWordAddress !== 'undefined') {
				velocity = memoryBuffer[velocityWordAddress];
			}

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
		}
	);
}
