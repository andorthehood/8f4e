import resetMidi from './resetMidi';
import broadcastMidiMessages from './broadcastMidiMessages';
import broadcastMidiCCMessages from './broadcastMidiCCMessages';
import { createMidiCCInputLookup } from './midiRouting';
import createModule from './createModule';

import type { MidiCCModuleAddresses, MidiModuleAddresses } from './types';

let interval: ReturnType<typeof setInterval>;
let statsInterval: ReturnType<typeof setInterval>;
let memoryBuffer: Int32Array;
let midiCCInputModules: Map<string, MidiCCModuleAddresses> = new Map();
let midiNoteInputModules: MidiModuleAddresses[] = [];
let timeToExecuteLoopMs: number;
let lastIntervalTime: number;
let timerDriftMs: number;

async function init(
	memoryRef: WebAssembly.Memory,
	sampleRate: number,
	codeBuffer: Uint8Array,
	midiNoteOutputs: MidiModuleAddresses[],
	midiNoteInputs: MidiModuleAddresses[],
	midiCCOutputs: MidiCCModuleAddresses[],
	midiCCInputs: MidiCCModuleAddresses[]
) {
	try {
		const wasmApp = await createModule(memoryRef, codeBuffer);
		memoryBuffer = wasmApp.memoryBuffer;

		midiNoteInputModules = midiNoteInputs;
		midiCCInputModules = createMidiCCInputLookup(midiCCInputs, memoryBuffer);

		resetMidi();

		const intervalTime = Math.floor(1000 / sampleRate);

		lastIntervalTime = performance.now();
		clearInterval(interval);
		interval = setInterval(() => {
			const startTime = performance.now();
			timerDriftMs = startTime - lastIntervalTime - intervalTime;
			lastIntervalTime = startTime;
			wasmApp.cycle();
			const endTime = performance.now();
			timeToExecuteLoopMs = endTime - startTime;
			broadcastMidiCCMessages(midiCCOutputs, memoryBuffer);
			broadcastMidiMessages(midiNoteOutputs, memoryBuffer);
		}, intervalTime);

		clearInterval(statsInterval);
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
	if (!memoryBuffer) {
		return;
	}

	if (message[0] >= 144 && message[0] <= 159) {
		const channel = message[0] - 143;
		for (const module of midiNoteInputModules) {
			const expectedChannel =
				typeof module.channelWordAddress !== 'undefined' ? memoryBuffer[module.channelWordAddress] || 1 : 1;
			const expectedPort =
				typeof module.portWordAddress !== 'undefined' ? memoryBuffer[module.portWordAddress] || 1 : 1;

			if (expectedChannel !== channel || expectedPort !== 1) {
				continue;
			}

			if (typeof module.noteWordAddress !== 'undefined') {
				memoryBuffer[module.noteWordAddress] = message[1];
			}
			if (typeof module.velocityWordAddress !== 'undefined') {
				memoryBuffer[module.velocityWordAddress] = message[2];
			}
			if (typeof module.noteOnOffWordAddress !== 'undefined') {
				memoryBuffer[module.noteOnOffWordAddress] = message[2] > 0 ? 1 : 0;
			}
		}
		return;
	}

	if (message[0] >= 128 && message[0] <= 143) {
		const channel = message[0] - 127;
		for (const module of midiNoteInputModules) {
			const expectedChannel =
				typeof module.channelWordAddress !== 'undefined' ? memoryBuffer[module.channelWordAddress] || 1 : 1;
			const expectedPort =
				typeof module.portWordAddress !== 'undefined' ? memoryBuffer[module.portWordAddress] || 1 : 1;

			if (expectedChannel !== channel || expectedPort !== 1) {
				continue;
			}

			if (typeof module.noteWordAddress !== 'undefined') {
				memoryBuffer[module.noteWordAddress] = message[1];
			}
			if (typeof module.velocityWordAddress !== 'undefined') {
				memoryBuffer[module.velocityWordAddress] = message[2];
			}
			if (typeof module.noteOnOffWordAddress !== 'undefined') {
				memoryBuffer[module.noteOnOffWordAddress] = 0;
			}
		}
		return;
	}

	if (message[0] >= 176 && message[0] <= 191) {
		const valueWordAddress = midiCCInputModules.get(`${message[0] - 175}:${message[1]}`)?.valueWordAddress;

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
				event.data.payload.midiNoteOutputs,
				event.data.payload.midiNoteInputs,
				event.data.payload.midiCCOutputs,
				event.data.payload.midiCCInputs
			);
			break;
	}
};
