import { Connection, Module, setUpConnections } from '@8f4e/compiler';

import createModule from './createModule';
import resetMidi from './resetMidi';
import findMidiNoteModules from './findMidiNoteModules';
import broadcastMidiMessages from './broadcastMidiMessages';
import findMidiCCModules from './findMidiCCModules';
import broadcastMidiCCMessages from './broadcastMidiCCMessages';
import findRNBOModules from './findRNBOModules';
import broadcastRNBOMessages from './broadcastRNBOMessages';

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
			compiledModules,
		},
	});

	clearInterval(interval);

	const midiNoteModules = findMidiNoteModules(compiledModules, memoryAddressLookup);
	const RNBOModules = findRNBOModules(compiledModules);
	const midiCCModules = findMidiCCModules(compiledModules, memoryAddressLookup);

	resetMidi();

	interval = setInterval(() => {
		cycle();
		broadcastMidiCCMessages(midiCCModules, memoryBuffer);
		broadcastMidiMessages(midiNoteModules, memoryBuffer);
		broadcastRNBOMessages(RNBOModules, memoryBuffer);
	}, intervalTime);
}

self.onmessage = function (event) {
	recompile(event.data.memoryRef, event.data.modules, event.data.connections);
};
