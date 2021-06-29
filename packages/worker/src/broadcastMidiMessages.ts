import { int16ToMidiNote } from '../../../src/state/helpers/midi';
import { Event } from '../../../src/midi/enums';
import { I16_SIGNED_LARGEST_NUMBER, MemoryBuffer } from 'compiler';
import { MidiModuleAddresses } from './types';

export default function (
	midiNoteModules: MidiModuleAddresses[],
	wasOn: boolean[],
	sampleAndHold: number[],
	memoryBuffer: MemoryBuffer
): void {
	midiNoteModules.forEach(({ noteAddress, noteOnOffAddress, channelAddress, velocityAddress }, index) => {
		const note = int16ToMidiNote(memoryBuffer[noteAddress]);
		const isOn = memoryBuffer[noteOnOffAddress] !== 0;
		const channel = memoryBuffer[channelAddress] || 1;
		const velocity = (memoryBuffer[velocityAddress] / I16_SIGNED_LARGEST_NUMBER + 1) * 50 || 127;

		if (isOn && !wasOn[index]) {
			sampleAndHold[index] = note;
			self.postMessage({
				type: 'midiMessage',
				payload: {
					message: [Event.NOTE_ON + channel - 1, note, velocity],
				},
			});
		} else if (!isOn && wasOn[index]) {
			self.postMessage({
				type: 'midiMessage',
				payload: {
					message: [Event.NOTE_OFF + channel - 1, sampleAndHold[index], velocity],
				},
			});
		}

		wasOn[index] = isOn;
	});
}
