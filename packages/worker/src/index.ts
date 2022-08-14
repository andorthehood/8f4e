import { Connection, Module, setUpConnections } from '@8f4e/synth-compiler';
import createModule from './createModule';
import resetMidi from './resetMidi';
import findMidiNoteModules from './findMidiNoteModules';
import broadcastMidiMessages from './broadcastMidiMessages';
import findMidiCCModules from './findMidiCCModules';
import broadcastMidiCCMessages from './broadcastMidiCCMessages';

let interval: NodeJS.Timeout;
const intervalTime = 10;

async function recompile(memoryRef: WebAssembly.Memory, modules: Module[], connections: Connection[]) {
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

	const midiNoteModules = findMidiNoteModules(compiledModules, memoryBuffer, memoryAddressLookup);
	const midiCCModules = findMidiCCModules(compiledModules, memoryBuffer, memoryAddressLookup);

	resetMidi();

	interval = setInterval(() => {
		cycle();
		broadcastMidiCCMessages(midiCCModules, memoryBuffer);
		broadcastMidiMessages(midiNoteModules, memoryBuffer);
	}, intervalTime);
}

self.onmessage = function (event) {
	recompile(event.data.memoryRef, event.data.modules, event.data.connections);
};
