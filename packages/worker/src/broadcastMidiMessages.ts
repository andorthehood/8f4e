import { int16ToMidiNote } from '../../../src/state/helpers/midi';
import { Event } from '../../../src/midi/enums';
import { I16_SIGNED_LARGEST_NUMBER, MemoryBuffer } from 'compiler';
import { MidiModuleAddresses } from './types';

const wasOn = new Map<string, boolean>();
const sampleAndHold = new Map<string, number>();

export default function (midiNoteModules: MidiModuleAddresses[], memoryBuffer: MemoryBuffer): void {
	midiNoteModules.forEach(({ noteAddress, noteOnOffAddress, channelAddress, velocityAddress, moduleId }) => {
		const note = int16ToMidiNote(memoryBuffer[noteAddress]);
		const isOn = memoryBuffer[noteOnOffAddress] !== 0;
		const channel = memoryBuffer[channelAddress] || 1;
		const velocity = (memoryBuffer[velocityAddress] / I16_SIGNED_LARGEST_NUMBER + 1) * 50 || 127;

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
