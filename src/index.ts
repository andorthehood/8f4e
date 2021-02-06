import events from './events';
import state from './state';
import view from './view';

async function init() {
	view(state(events()));
}

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', init);
}
