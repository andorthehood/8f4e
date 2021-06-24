import compile, { Connection, Module, setUpConnections } from 'compiler';
import { int16ToMidiNote } from '../../../src/state/helpers/midi';
import { Event, ControlChange } from '../../../src/midi/enums';

function resetMidi() {
	self.postMessage({
		type: 'midiMessage',
		payload: {
			message: [Event.CONTROL_CHANGE, ControlChange.ALL_SOUND_OFF, 0],
		},
	});
	self.postMessage({
		type: 'midiMessage',
		payload: {
			message: [Event.CONTROL_CHANGE, ControlChange.ALL_NOTE_OFF, 0],
		},
	});

	for (let i = 0; i < 128; i++) {
		self.postMessage({
			type: 'midiMessage',
			payload: {
				message: [Event.NOTE_OFF, i, 0],
			},
		});
	}
}

async function createModule(memoryRef, modules: Module[]) {
	const { codeBuffer, memoryAddressLookup, compiledModules } = compile(modules);

	const memoryBuffer = new Int32Array(memoryRef.buffer);

	const { instance } = await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
		},
	});

	const cycle = instance.exports.cycle as CallableFunction;
	const init = instance.exports.init as CallableFunction;

	return { memoryBuffer, cycle, init, memoryAddressLookup, compiledModules };
}

let interval: NodeJS.Timeout;

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

	const intervalTime = 10;

	clearInterval(interval);

	let wasHigh = false;

	const cvToMidiModule = compiledModules.find(({ moduleId }) => moduleId.startsWith('cvToMidi'));
	let cvAddress, clockAddress, channelAddress;
	if (cvToMidiModule) {
		cvAddress =
			cvToMidiModule.memoryAddresses.find(({ id }) => id === 'out:1').address / memoryBuffer.BYTES_PER_ELEMENT;

		clockAddress =
			cvToMidiModule.memoryAddresses.find(({ id }) => id === 'out:2').address / memoryBuffer.BYTES_PER_ELEMENT;

		channelAddress =
			cvToMidiModule.memoryAddresses.find(({ id }) => id === 'channel').address / memoryBuffer.BYTES_PER_ELEMENT;
	}

	resetMidi();

	interval = setInterval(() => {
		cycle();

		if (cvAddress && clockAddress) {
			const note = int16ToMidiNote(memoryBuffer[cvAddress]);
			const isHigh = memoryBuffer[clockAddress] !== 0;
			const channel = memoryBuffer[channelAddress] || 1;

			if (isHigh && !wasHigh) {
				self.postMessage({
					type: 'midiMessage',
					payload: {
						message: [Event.NOTE_ON + channel - 1, note, 100],
					},
				});

				setTimeout(() => {
					self.postMessage({
						type: 'midiMessage',
						payload: {
							message: [Event.NOTE_OFF + channel - 1, note, 100],
						},
					});
				}, 100);
			} else if (!isHigh && wasHigh) {
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
}

self.onmessage = function (event) {
	recompile(event.data.memoryRef, event.data.modules, event.data.connections);
};
