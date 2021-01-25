import events from './ui/events';
import state from './ui/state';
import view from './ui/view';
import compiler from './compiler';

(async function () {
	const blob = new Blob([compiler().buffer], { type: 'application/wasm' });
	const src = URL.createObjectURL(blob);
	console.log(src);

	const { instance } = await WebAssembly.instantiate(compiler());
	console.log(instance.exports.add(1, 1));
})();

if (document.readyState === 'complete') {
	view(state(events()));
} else {
	window.addEventListener('DOMContentLoaded', function () {
		view(state(events()));
	});
}
