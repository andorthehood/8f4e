import { Event } from '../../../src/midi/enums';
import { MemoryBuffer } from 'compiler';
import { MidiCCModuleAddresses } from './types';

export default function (midiNoteModules: MidiCCModuleAddresses[], memoryBuffer: MemoryBuffer): void {
	midiNoteModules.forEach(({ channelAddress, selectedCCAddress }) => {
		const cc = memoryBuffer[selectedCCAddress];
		const channel = memoryBuffer[channelAddress] || 1;

		self.postMessage({
			type: 'midiMessage',
			payload: {
				message: [Event.CONTROL_CHANGE + channel - 1, cc, 0],
			},
		});
	});
}
