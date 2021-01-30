import events from './ui/events';
import state from './ui/state';
import view from './ui/view';
import compiler from './compiler';

async function init() {
	const blob = new Blob([compiler().buffer], { type: 'application/wasm' });
	const src = URL.createObjectURL(blob);
	console.log(src);

	const memory = new WebAssembly.Memory({ initial: 1 });
	const { instance } = await WebAssembly.instantiate(compiler(), {
		js: {
			memory,
		},
	});

	instance.exports.setRate(100);
	console.log(instance.exports.getRate());
	console.log('modulo', instance.exports.modulo(1, 3));

	console.log('memorydebug', new Uint8Array(memory.buffer));

	setInterval(() => {
		//console.log(instance.exports.channel1());
		instance.exports.setRate(instance.exports.getRate() + 1);
	}, 10);

	const memoryBuffer = new Uint32Array(memory.buffer);

	view(state(events()), memoryBuffer);
}

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', init);
}
