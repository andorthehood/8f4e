const init = function () {};

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', init);
}
