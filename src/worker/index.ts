import compile from '../../packages/compiler';
import { setUpConnections } from '../../packages/compiler/initializeMemory';
import { int16ToMidiNote } from '../state/helpers/midi';
import { Event, ControlChange } from '../midi/enums';

const resetMidi = function () {
	// @ts-ignore
	self.postMessage({
		type: 'midiMessage',
		payload: {
			message: [Event.CONTROL_CHANGE, ControlChange.ALL_SOUND_OFF, 0],
		},
	});
	// @ts-ignore
	self.postMessage({
		type: 'midiMessage',
		payload: {
			message: [Event.CONTROL_CHANGE, ControlChange.ALL_NOTE_OFF, 0],
		},
	});

	for (let i = 0; i < 128; i++) {
		// @ts-ignore
		self.postMessage({
			type: 'midiMessage',
			payload: {
				message: [Event.NOTE_OFF, i, 0],
			},
		});
	}
};

export const createModule = async function (memoryRef, modules) {
	const { codeBuffer, outputAddressLookup, compiledModules } = compile(modules);

	const memoryBuffer = new Int32Array(memoryRef.buffer);

	const {
		instance: {
			exports: { cycle, init },
		},
	} = await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
		},
	});

	return { memoryBuffer, cycle, init, outputAddressLookup, compiledModules };
};

let interval;

const recompile = async function (memoryRef, modules, connections) {
	const { memoryBuffer, cycle, outputAddressLookup, init, compiledModules } = await createModule(memoryRef, modules);

	// @ts-ignore
	init();
	setUpConnections(memoryBuffer, compiledModules, connections);

	// @ts-ignore
	self.postMessage({
		type: 'compilationDone',
		payload: {
			outputAddressLookup,
		},
	});

	const intervalTime = 10;

	clearInterval(interval);

	let wasHigh = false;

	const cvToMidiModule = compiledModules.find(({ moduleId }) => moduleId.startsWith('cvToMidi'));
	let cvAddress, clockAddress;
	if (cvToMidiModule) {
		cvAddress =
			memoryBuffer[
				cvToMidiModule.memoryAddresses.find(({ id }) => id === 'cvin').address / Uint32Array.BYTES_PER_ELEMENT
			];
		clockAddress =
			memoryBuffer[
				cvToMidiModule.memoryAddresses.find(({ id }) => id === 'clockin').address / Uint32Array.BYTES_PER_ELEMENT
			];
	}

	resetMidi();

	interval = setInterval(() => {
		// @ts-ignore
		cycle();

		if (cvAddress && clockAddress) {
			const note = int16ToMidiNote(memoryBuffer[cvAddress / Uint32Array.BYTES_PER_ELEMENT]);
			const isHigh = memoryBuffer[clockAddress / Uint32Array.BYTES_PER_ELEMENT] !== 0;

			if (isHigh && !wasHigh) {
				// @ts-ignore
				self.postMessage({
					type: 'midiMessage',
					payload: {
						message: [Event.NOTE_ON, note, 100],
					},
				});

				setTimeout(() => {
					// @ts-ignore
					self.postMessage({
						type: 'midiMessage',
						payload: {
							message: [Event.NOTE_OFF, note, 100],
						},
					});
				}, 100);
			} else if (!isHigh && wasHigh) {
				// @ts-ignore
				// self.postMessage({
				// 	type: 'midiMessage',
				// 	payload: {
				// 		message: [Event.NOTE_OFF, note, 100],
				// 	},
				// });
			}
			wasHigh = isHigh;
		}
	}, intervalTime);
};

self.onmessage = function (event) {
	recompile(event.data.memoryRef, event.data.modules, event.data.connections);
};
