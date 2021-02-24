import compile from '../compiler';
import { setUpConnections } from '../compiler/initializeMemory';
import { Event } from '../midi/enums';
import { findWhatIsConnectedTo } from '../helpers/connectionHelpers';

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

	const intervalTime = 10;

	clearInterval(interval);

	let wasHigh = false;

	interval = setInterval(() => {
		// @ts-ignore
		cycle();

		const connectionCV = findWhatIsConnectedTo(connections, 'cvToMidi1', 'cvin');
		const connectionClock = findWhatIsConnectedTo(connections, 'cvToMidi1', 'clockin');

		if (connectionCV && connectionClock) {
			const fromModuleCV = connectionCV.moduleId;
			const fromModuleClock = connectionClock.moduleId;

			const addressCV = outputAddressLookup[fromModuleCV + 'out1'];
			const note = Math.floor(((memoryBuffer[addressCV / 4] + 32767) / 32767) * 10) + 40;

			const addressClock = outputAddressLookup[fromModuleClock + 'out1'];
			const isHigh = memoryBuffer[addressClock / 4] !== 0;

			if (isHigh && !wasHigh) {
				// @ts-ignore
				self.postMessage({
					type: 'midiMessage',
					payload: {
						message: [Event.NOTE_ON, note, 100],
					},
				});
			} else if (!isHigh && wasHigh) {
				// @ts-ignore
				self.postMessage({
					type: 'midiMessage',
					payload: {
						message: [Event.NOTE_OFF, note, 100],
					},
				});
			}
			wasHigh = isHigh;
		}
	}, intervalTime);
};

self.onmessage = function (event) {
	recompile(event.data.memoryRef, event.data.modules, event.data.connections);
};
