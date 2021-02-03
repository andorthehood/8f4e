import events from './events';
import createState from './state';
import view from './view';
import compiler, { initializeMemory } from './compiler';
import tests from '../tests';

async function createModule(state) {
	const { memoryRef, memoryBuffer } = initializeMemory(state.ui.modules);

	const {
		instance: {
			exports: { cycle },
		},
	} = await WebAssembly.instantiate(compiler(state.ui.modules, state.ui.connections), {
		js: {
			memory: memoryRef,
		},
	});

	return { memoryBuffer, cycle };
}

async function init() {
	await tests();

	const state = createState(events());

	const { memoryBuffer, cycle } = await createModule(state);

	setInterval(() => {
		const start = performance.now();
		cycle();
		const end = performance.now() - start;
		console.log(end);
		//console.log(memoryBuffer.slice(0, 16));
	}, 100);

	view(state, memoryBuffer);
}

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', init);
}
