import { CompileOptions, Module } from '@8f4e/compiler';

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

async function recompile(memoryRef: WebAssembly.Memory, modules: Module[], compilerOptions: CompileOptions) {
	try {
		const { codeBuffer, compiledModules } = await testBuild(memoryRef, modules, compilerOptions);
		self.postMessage({
			type: 'buildOk',
			payload: {
				codeBuffer,
				compiledModules,
			},
		});

		clearInterval(interval);

		const memoryBuffer = new Int32Array(memoryRef.buffer);

		const midiNoteModules = findMidiNoteModules(compiledModules, memoryBuffer);
		const RNBOModules = findRNBOModules(compiledModules);
		const midiCCModules = findMidiCCModules(compiledModules, memoryBuffer);

		resetMidi();

		interval = setInterval(() => {
			broadcastMidiCCMessages(midiCCModules, memoryBuffer);
			broadcastMidiMessages(midiNoteModules, memoryBuffer);
			broadcastRNBOMessages(RNBOModules, memoryBuffer);
		}, intervalTime);
	} catch (error) {
		console.log('buildError', error);
		self.postMessage({
			type: 'buildError',
			payload: error,
		});
	}
}

self.onmessage = function (event) {
	recompile(event.data.memoryRef, event.data.modules, event.data.compilerOptions);
};
