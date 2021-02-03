import compile, { initializeMemory } from '../../compiler';

async function createModule(state) {
	const { memoryRef, memoryBuffer } = initializeMemory(state.ui.modules);

	const {
		instance: {
			exports: { cycle },
		},
	} = await WebAssembly.instantiate(compile(state.ui.modules, state.ui.connections), {
		js: {
			memory: memoryRef,
		},
	});

	return { memoryBuffer, cycle };
}

const compiler = function (state, events) {
	let interval;

	const recompile = async () => {
		clearInterval(interval);

		const start = performance.now();
		const { memoryBuffer, cycle } = await createModule(state);

		state.memory = memoryBuffer;

		interval = setInterval(() => {
			const start = performance.now();
			// @ts-ignore
			cycle();
			const end = performance.now() - start;
			//console.log(end);
			//console.log(memoryBuffer.slice(0, 16));
			events.dispatch('sendMidiMessage', { message: [0x90, memoryBuffer[0] + 50, 100] });
			events.dispatch('sendMidiMessage', { message: [0x80, memoryBuffer[0] + 50, 100], delay: Date.now() + 100 });
		}, 1000);

		const end = performance.now() - start;
		console.log('Compilation time (ms):', end);
	};

	events.on('addModule', recompile);
	events.on('deleteModule', recompile);

	return () => {
		events.off('addModule', recompile);
		events.off('deleteModule', recompile);
	};
};

export default compiler;
