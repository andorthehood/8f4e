import events from './events';
import state from './state';
import view from './view';
import tests from '../tests';

async function init() {
	await tests();
	view(state(events()));
}

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', init);
}
