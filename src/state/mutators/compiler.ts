import compile, { initializeMemory } from '../../compiler';
import { Event } from '../../midi/enums';

async function createModule(state) {
	const { memoryRef, memoryBuffer } = initializeMemory(state.ui.modules);
	const { codeBuffer, outputAddressLookup } = compile(state.ui.modules, state.ui.connections);

	const {
		instance: {
			exports: { cycle },
		},
	} = await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
		},
	});

	return { memoryBuffer, cycle, outputAddressLookup };
}

const compiler = function (state, events) {
	let interval;

	const recompile = async () => {
		clearInterval(interval);

		const start = performance.now();
		const { memoryBuffer, cycle, outputAddressLookup } = await createModule(state);

		state.memory = memoryBuffer;

		interval = setInterval(() => {
			const start = performance.now();
			// @ts-ignore
			cycle();
			const end = performance.now() - start;
			//console.log(end);
			//console.log(memoryBuffer.slice(0, 16));

			const connection = state.ui.connections.find(
				({ toModule, toConnector, fromModule, fromConnector }) =>
					(toModule === 'cvToMidi1' || fromModule === 'cvToMidi1') &&
					(toConnector === 'cvin' || fromConnector === 'cvin')
			);

			if (connection) {
				const fromModule = connection.fromModule === 'cvToMidi1' ? connection.toModule : connection.fromModule;
				const address = outputAddressLookup[fromModule][0].memoryAddress;
				events.dispatch('sendMidiMessage', { message: [Event.NOTE_ON, memoryBuffer[address / 4] + 50, 100] });
				events.dispatch('sendMidiMessage', {
					message: [Event.NOTE_OFF, memoryBuffer[address] + 50, 100],
					delay: Date.now() + 100,
				});
			}
		}, 1000);

		const end = performance.now() - start;
		console.log('Compilation time (ms):', end);
	};

	events.on('addModule', recompile);
	events.on('deleteModule', recompile);
	events.on('init', recompile);

	return () => {
		events.off('addModule', recompile);
		events.off('deleteModule', recompile);
		events.off('init', recompile);
	};
};

export default compiler;
