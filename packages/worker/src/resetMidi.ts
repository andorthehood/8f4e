import { ControlChange, Event } from './midiEnums';

export default function resetMidi(): void {
	self.postMessage({
		type: 'midiMessage',
		payload: {
			message: [Event.CONTROL_CHANGE, ControlChange.ALL_SOUND_OFF, 0],
		},
	});
	self.postMessage({
		type: 'midiMessage',
		payload: {
			message: [Event.CONTROL_CHANGE, ControlChange.ALL_NOTE_OFF, 0],
		},
	});

	for (let i = 0; i < 128; i++) {
		self.postMessage({
			type: 'midiMessage',
			payload: {
				message: [Event.NOTE_OFF, i, 0],
			},
		});
	}
}
