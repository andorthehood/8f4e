import { EventDispatcher } from '../../events';
import { State } from '../types';

export default async function midi(state: State, events: EventDispatcher): Promise<void> {
	let selectedOutput: MIDIOutput;
	let selectedInput: MIDIInput;
	let midiAccess: MIDIAccess;

	function onMidiMessage(event) {
		events.dispatch('midiMessage', event.data);
	}

	function onMidiAccess(access: MIDIAccess) {
		midiAccess = access;

		access.outputs.forEach(port => {
			state.midi.outputs.push(port);
			selectedOutput = port;
			events.dispatch('midiPortConnected');
		});

		access.inputs.forEach(port => {
			state.midi.inputs.push(port);
			selectedInput = port;
			events.dispatch('midiPortConnected');
		});

		if (selectedInput) {
			selectedInput.addEventListener('midimessage', onMidiMessage);
		}
	}

	function onSelectMidiOutput({ id }) {
		midiAccess.outputs.forEach(function (port) {
			if (port.id === id) {
				selectedOutput = port;
			}
		});
	}

	function onSendMidiMessage({ message, delay }) {
		if (selectedOutput) {
			selectedOutput.send(message, delay);
		}
	}

	navigator.requestMIDIAccess().then(onMidiAccess);
	events.on('selectMidiOutput', onSelectMidiOutput);
	events.on('sendMidiMessage', onSendMidiMessage);
}
