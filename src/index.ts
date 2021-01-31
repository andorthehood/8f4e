import events from './ui/events';
import state from './ui/state';
import view from './ui/view';
import compiler from './compiler';
import tests from '../tests';

async function init() {
	const blob = new Blob([compiler().buffer], { type: 'application/wasm' });
	const src = URL.createObjectURL(blob);
	console.log(src);

	await tests();

	const memory = new WebAssembly.Memory({ initial: 1 });
	const { instance } = await WebAssembly.instantiate(compiler(), {
		js: {
			memory,
		},
	});

	setInterval(() => {
		instance.exports.setRate(instance.exports.getRate() + 1);
	}, 100);

	const memoryBuffer = new Uint32Array(memory.buffer);

	view(state(events()), memoryBuffer);
}

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', init);
}
