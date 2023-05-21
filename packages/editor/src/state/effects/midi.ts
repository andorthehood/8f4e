import { EventDispatcher } from '../../events';
import { State } from '../types';

export default async function midi(state: State, events: EventDispatcher): Promise<void> {
	let selectedPort: MIDIOutput;
	let midiAccess: MIDIAccess;

	function onMidiAccess(access) {
		midiAccess = access;

		access.outputs.forEach(port => {
			state.midi.ports.push(port);
			selectedPort = port;
			events.dispatch('midiPortConnected');
		});
	}

	function onSelectMidiOutput({ id }) {
		midiAccess.outputs.forEach(function (port) {
			if (port.id === id) {
				selectedPort = port;
			}
		});
	}

	function onSendMidiMessage({ message, delay }) {
		if (selectedPort) {
			selectedPort.send(message, delay);
		}
	}

	// @ts-ignore
	navigator.requestMIDIAccess().then(onMidiAccess);
	events.on('selectMidiOutput', onSelectMidiOutput);
	events.on('sendMidiMessage', onSendMidiMessage);
}
