import { CompileOptions, Module } from '@8f4e/compiler';

import testBuild from './testBuild';
import resetMidi from './resetMidi';
import findMidiNoteOutModules from './findMidiNoteOutModules';
import broadcastMidiMessages from './broadcastMidiMessages';
import findMidiCCOutputModules from './findMidiCCOutputModules';
import broadcastMidiCCMessages from './broadcastMidiCCMessages';
import findRNBOModules from './findRNBOModules';
import broadcastRNBOMessages from './broadcastRNBOMessages';
import findMidiCCInputModules from './findMidiCCInputModules';
import { MidiCCModuleAddresses } from './types';

let interval: NodeJS.Timeout;
const intervalTime = 10;
let memoryBuffer: Int32Array;
let midiCCInputModules: Map<string, MidiCCModuleAddresses> = new Map();

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

		memoryBuffer = new Int32Array(memoryRef.buffer);

		const midiNoteModules = findMidiNoteOutModules(compiledModules, memoryBuffer);
		const RNBOModules = findRNBOModules(compiledModules);
		const midiCCOutputModules = findMidiCCOutputModules(compiledModules, memoryBuffer);
		midiCCInputModules = findMidiCCInputModules(compiledModules, memoryBuffer);

		resetMidi();

		interval = setInterval(() => {
			broadcastMidiCCMessages(midiCCOutputModules, memoryBuffer);
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

function onMidiMessage(message: Uint8Array) {
	if (!memoryBuffer || midiCCInputModules.size < 1) {
		return;
	}

	if (message[0] >= 176 && message[0] <= 191) {
		const valueWordAddress = midiCCInputModules.get(message[0] - 175 + '' + message[1])?.valueWordAddress;

		if (valueWordAddress) {
			memoryBuffer[valueWordAddress] = message[2];
		}
	}
}

self.onmessage = function (event) {
	switch (event.data.type) {
		case 'midimessage':
			onMidiMessage(event.data.payload);
			break;
		case 'recompile':
			recompile(event.data.payload.memoryRef, event.data.payload.modules, event.data.payload.compilerOptions);
			break;
	}
};
