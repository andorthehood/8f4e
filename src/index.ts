import events from './ui/events';
import state from './ui/state';
import view from './ui/view';
import compiler from './compiler';

(async function () {
	const blob = new Blob([compiler().buffer], { type: 'application/wasm' });
	const src = URL.createObjectURL(blob);
	console.log(src);

	const memory = new WebAssembly.Memory({ initial: 1 });
	const { instance } = await WebAssembly.instantiate(compiler(), {
		js: {
			memory,
		},
	});

	instance.exports.setRate(12000);
	console.log(instance.exports.getRate());

	console.log('memorydebug', new Uint8Array(memory.buffer));

	setInterval(() => {
		console.log(instance.exports.channel1());
	}, 1000);
})();

if (document.readyState === 'complete') {
	view(state(events()));
} else {
	window.addEventListener('DOMContentLoaded', function () {
		view(state(events()));
	});
}
