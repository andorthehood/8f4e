import compile from '../../compiler';
import { Event } from '../../midi/enums';

async function createModule(state) {
	const { codeBuffer, outputAddressLookup, memoryRef, memoryBuffer } = compile(state.ui.modules, state.ui.connections);

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
		state.ui.compiler.isCompiling = true;
		clearInterval(interval);

		const start = performance.now();
		const { memoryBuffer, cycle, outputAddressLookup } = await createModule(state);

		state.memory = memoryBuffer;

		interval = setInterval(() => {
			const start = performance.now();
			// @ts-ignore
			cycle();
			const end = performance.now() - start;

			const connection = state.ui.connections.find(
				({ toModule, toConnector, fromModule, fromConnector }) =>
					(toModule === 'cvToMidi1' || fromModule === 'cvToMidi1') &&
					(toConnector === 'cvin' || fromConnector === 'cvin')
			);

			if (connection) {
				const fromModule = connection.fromModule === 'cvToMidi1' ? connection.toModule : connection.fromModule;
				console.log(fromModule, outputAddressLookup);
				const address = outputAddressLookup[fromModule].find(({ isInputPointer }) => !isInputPointer).address;
				events.dispatch('sendMidiMessage', { message: [Event.NOTE_ON, memoryBuffer[address / 4] + 50, 100] });
				events.dispatch('sendMidiMessage', {
					message: [Event.NOTE_OFF, memoryBuffer[address] + 50, 100],
					delay: Date.now() + 100,
				});
			}
		}, 1000);

		const end = performance.now() - start;
		state.ui.compiler.compilationTime = end.toFixed(2);
		state.ui.compiler.isCompiling = false;
		state.ui.compiler.outputAddressLookup = outputAddressLookup;
		state.ui.compiler.memoryBuffer = memoryBuffer;
	};

	events.on('createConnection', recompile);
	events.on('deleteConnection', recompile);
	events.on('addModule', recompile);
	events.on('deleteModule', recompile);
	events.on('init', recompile);

	return () => {
		events.off('createConnection', recompile);
		events.off('deleteConnection', recompile);
		events.off('addModule', recompile);
		events.off('deleteModule', recompile);
		events.off('init', recompile);
	};
};

export default compiler;
