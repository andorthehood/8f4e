import { Connection, Module, setUpConnections } from 'compiler';
import createModule from './createModule';
import resetMidi from './resetMidi';
import findMidiNoteModules from './findMidiNoteModules';
import broadcastMidiMessages from './broadcastMidiMessages';
import findMidiCCModules from './findMidiCCModules';
import broadcastMidiCCMessages from './broadcastMidiCCMessages';

let interval: NodeJS.Timeout;
const intervalTime = 10;

async function recompile(memoryRef, modules: Module[], connections: Connection[]) {
	const { memoryBuffer, cycle, memoryAddressLookup, init, compiledModules } = await createModule(memoryRef, modules);

	init();
	setUpConnections(memoryBuffer, memoryAddressLookup, connections);

	self.postMessage({
		type: 'compilationDone',
		payload: {
			memoryAddressLookup,
		},
	});

	clearInterval(interval);

	const midiNoteModules = findMidiNoteModules(compiledModules, memoryBuffer);
	const wasOn: boolean[] = new Array(midiNoteModules.length).fill(false);
	const sampleAndHold: number[] = new Array(midiNoteModules.length).fill(0);

	const midiCCModules = findMidiCCModules(compiledModules, memoryBuffer);

	resetMidi();

	interval = setInterval(() => {
		cycle();

		broadcastMidiCCMessages(midiCCModules, memoryBuffer);
		broadcastMidiMessages(midiNoteModules, wasOn, sampleAndHold, memoryBuffer);
	}, intervalTime);
}

self.onmessage = function (event) {
	recompile(event.data.memoryRef, event.data.modules, event.data.connections);
};
