import { CompiledModuleLookup, Module } from '@8f4e/compiler';

import testBuild from './testBuild';
import resetMidi from './resetMidi';
import findMidiNoteModules from './findMidiNoteModules';
import broadcastMidiMessages from './broadcastMidiMessages';
import findMidiCCModules from './findMidiCCModules';
import broadcastMidiCCMessages from './broadcastMidiCCMessages';
import findRNBOModules from './findRNBOModules';
import broadcastRNBOMessages from './broadcastRNBOMessages';

let interval: NodeJS.Timeout;
const intervalTime = 10;

async function recompile(memoryRef: WebAssembly.Memory, modules: Module[], compiledModules: CompiledModuleLookup) {
	try {
		await testBuild(memoryRef, modules);
		self.postMessage({
			type: 'buildOk',
		});
	} catch (error) {
		self.postMessage({
			type: 'buildError',
			payload: error,
		});
	}

	clearInterval(interval);

	const memoryBuffer = new Int32Array(memoryRef.buffer);

	const midiNoteModules = findMidiNoteModules(compiledModules);
	const RNBOModules = findRNBOModules(compiledModules);
	const midiCCModules = findMidiCCModules(compiledModules);

	resetMidi();

	interval = setInterval(() => {
		broadcastMidiCCMessages(midiCCModules, memoryBuffer);
		broadcastMidiMessages(midiNoteModules, memoryBuffer);
		broadcastRNBOMessages(RNBOModules, memoryBuffer);
	}, intervalTime);
}

self.onmessage = function (event) {
	recompile(event.data.memoryRef, event.data.modules, event.data.compiledModules);
};
