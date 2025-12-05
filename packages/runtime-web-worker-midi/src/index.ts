import { CompiledModuleLookup } from '@8f4e/compiler';

import resetMidi from './resetMidi';
import findMidiNoteOutModules from './findMidiNoteOutModules';
import broadcastMidiMessages from './broadcastMidiMessages';
import findMidiCCOutputModules from './findMidiCCOutputModules';
import broadcastMidiCCMessages from './broadcastMidiCCMessages';
import findMidiCCInputModules from './findMidiCCInputModules';
import createModule from './createModule';

import type { MidiCCModuleAddresses } from './types';

let interval: ReturnType<typeof setInterval>;
let statsInterval: ReturnType<typeof setInterval>;
let memoryBuffer: Int32Array;
let midiCCInputModules: Map<string, MidiCCModuleAddresses> = new Map();
let timeToExecuteLoopMs: number;
let lastIntervalTime: number;
let timerDriftMs: number;

async function init(
	memoryRef: WebAssembly.Memory,
	sampleRate: number,
	codeBuffer: Uint8Array,
	compiledModules: CompiledModuleLookup
) {
	try {
		clearInterval(interval);
		clearInterval(statsInterval);

		const wasmApp = await createModule(memoryRef, codeBuffer);
		memoryBuffer = wasmApp.memoryBuffer;

		const midiNoteModules = findMidiNoteOutModules(compiledModules, memoryBuffer);
		const midiCCOutputModules = findMidiCCOutputModules(compiledModules, memoryBuffer);
		midiCCInputModules = findMidiCCInputModules(compiledModules, memoryBuffer);

		resetMidi();

		const intervalTime = Math.floor(1000 / sampleRate);

		interval = setInterval(() => {
			const startTime = performance.now();
			timerDriftMs = startTime - lastIntervalTime - intervalTime;
			lastIntervalTime = startTime;
			wasmApp.cycle();
			const endTime = performance.now();
			timeToExecuteLoopMs = endTime - startTime;
			broadcastMidiCCMessages(midiCCOutputModules, memoryBuffer);
			broadcastMidiMessages(midiNoteModules, memoryBuffer);
		}, intervalTime);

		statsInterval = setInterval(() => {
			self.postMessage({
				type: 'stats',
				payload: {
					timerPrecisionPercentage: 100 - Math.abs(timerDriftMs / intervalTime) * 100,
					timeToExecuteLoopMs,
					timerDriftMs,
					timerExpectedIntervalTimeMs: intervalTime,
				},
			});
		}, 10000);

		self.postMessage({
			type: 'initialized',
			payload: {},
		});
	} catch (error) {
		console.log('compilationError', error);
		self.postMessage({
			type: 'compilationError',
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
		case 'init':
			init(
				event.data.payload.memoryRef,
				event.data.payload.sampleRate,
				event.data.payload.codeBuffer,
				event.data.payload.compiledModules
			);
			break;
	}
};
