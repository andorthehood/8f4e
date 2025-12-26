import { Event } from './midiEnums';

import type { MemoryBuffer } from '@8f4e/compiler';
import type { MidiModuleAddresses } from './types';

const wasOn = new Map<string, boolean>();
const sampleAndHold = new Map<string, number>();

export default function (midiNoteModules: MidiModuleAddresses[], memoryBuffer: MemoryBuffer): void {
	midiNoteModules.forEach(
		({ noteWordAddress, noteOnOffWordAddress, channelWordAddress, velocityWordAddress, portWordAddress, moduleId }) => {
			if (typeof noteWordAddress === 'undefined' || typeof noteOnOffWordAddress === 'undefined') {
				return;
			}

			const note = memoryBuffer[noteWordAddress];
			const isOn = memoryBuffer[noteOnOffWordAddress] !== 0;
			const channel = typeof channelWordAddress !== 'undefined' ? memoryBuffer[channelWordAddress] : 1;
			const velocity = typeof velocityWordAddress !== 'undefined' ? memoryBuffer[velocityWordAddress] : 127;
			const port = typeof portWordAddress !== 'undefined' ? memoryBuffer[portWordAddress] : 1;

			if (note < 0 || note > 127 || channel > 16 || channel < 1 || velocity < 0 || velocity > 127) {
				return;
			}

			if (isOn && !wasOn.get(moduleId)) {
				sampleAndHold.set(moduleId, note);
				self.postMessage({
					type: 'midiMessage',
					payload: {
						message: [Event.NOTE_ON + channel - 1, note, velocity],
						port,
					},
				});
			} else if (!isOn && wasOn.get(moduleId)) {
				self.postMessage({
					type: 'midiMessage',
					payload: {
						message: [Event.NOTE_OFF + channel - 1, sampleAndHold.get(moduleId), velocity],
						port,
					},
				});
			}

			wasOn.set(moduleId, isOn);
		}
	);
}
