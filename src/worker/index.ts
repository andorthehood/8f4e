import compile from '../compiler';
import { setUpConnections } from '../compiler/initializeMemory';
import { Event } from '../midi/enums';

export const createModule = async function (memoryRef, modules, connections) {
	const { codeBuffer, outputAddressLookup, compiledModules } = compile(modules, connections);

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
	const { memoryBuffer, cycle, outputAddressLookup, init, compiledModules } = await createModule(
		memoryRef,
		modules,
		connections
	);

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

	const intervalTime = 100;

	clearInterval(interval);
	interval = setInterval(() => {
		// @ts-ignore
		cycle();

		const connection = connections.find(
			({ toModule, toConnector, fromModule, fromConnector }) =>
				(toModule === 'cvToMidi1' || fromModule === 'cvToMidi1') && (toConnector === 'cvin' || fromConnector === 'cvin')
		);

		if (connection) {
			const fromModule = connection.fromModule === 'cvToMidi1' ? connection.toModule : connection.fromModule;
			const address = outputAddressLookup[fromModule].find(({ isInputPointer }) => !isInputPointer).address;

			// @ts-ignore
			self.postMessage({
				type: 'midiMessage',
				payload: {
					message: [Event.NOTE_ON, memoryBuffer[address / 4] + 70, 100],
				},
			});
			// @ts-ignore
			self.postMessage({
				type: 'midiMessage',
				payload: {
					message: [Event.NOTE_OFF, memoryBuffer[address / 4] + 70, 100],
					delay: Date.now() + 100,
				},
			});
		}
	}, intervalTime);
};

self.onmessage = function (event) {
	recompile(event.data.memoryRef, event.data.modules, event.data.connections);
};
