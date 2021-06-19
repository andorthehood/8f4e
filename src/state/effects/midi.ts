import { State } from '../types';

export default async function midi(state: State, events): Promise<void> {
	let selectedPort;
	let midiAccess;

	function onMidiAccess(access) {
		midiAccess = access;

		access.outputs.forEach(port => {
			state.midi.ports.push({ id: port.id, name: port.name, manufacturer: port.manufacturer });
			selectedPort = port;
			events.dispatch('midiPortConnected');
		});
	}

	function onSelectMidiOutput({ id }) {
		selectedPort = midiAccess.outputs.forEach(function (port) {
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

	function onStateChange(e) {
		console.log(e.port.name, e.port.manufacturer, e.port.state);
	}

	navigator.requestMIDIAccess().then(onMidiAccess);
	//midiAccess.addEventListener('statechange', onStateChange);
	events.on('selectMidiOutput', onSelectMidiOutput);
	events.on('sendMidiMessage', onSendMidiMessage);
}
