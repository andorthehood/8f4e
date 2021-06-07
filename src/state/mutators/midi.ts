import { State } from '../types';

export default async function midi(state: State, events) {
	// @ts-ignore
	let selectedPort;
	let midiAccess;

	const onMidiAccess = function (access) {
		midiAccess = access;

		access.outputs.forEach(port => {
			state.midi.ports.push({ id: port.id, name: port.name, manufacturer: port.manufacturer });
			selectedPort = port;
			events.dispatch('midiPortConnected');
		});
	};

	const onSelectMidiOutput = function ({ id }) {
		selectedPort = midiAccess.outputs.forEach(function (port) {
			if (port.id === id) {
				selectedPort = port;
			}
		});
	};

	const onSendMidiMessage = function ({ message, delay }) {
		if (selectedPort) {
			selectedPort.send(message, delay);
		}
	};

	const onStateChange = function (e) {
		console.log(e.port.name, e.port.manufacturer, e.port.state);
	};

	// @ts-ignore requestMIDIAccess
	navigator.requestMIDIAccess().then(onMidiAccess);
	//midiAccess.addEventListener('statechange', onStateChange);
	events.on('selectMidiOutput', onSelectMidiOutput);
	events.on('sendMidiMessage', onSendMidiMessage);
}
