import events from './ui/events';
import state from './ui/state';
import view from './ui/view';
import compiler, { initializeMemory } from './compiler';
import tests from '../tests';

async function init() {
	await tests();

	const { memoryRef, memoryBuffer } = initializeMemory();

	const { instance } = await WebAssembly.instantiate(compiler(), {
		js: {
			memory: memoryRef,
		},
	});

	setInterval(() => {
		instance.exports.cycle();
		console.log(memoryBuffer.slice(0, 8));
	}, 100);

	view(state(events()), memoryBuffer);
}

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', init);
}
