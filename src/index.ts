import events from './ui/events';
import state from './ui/state';
import view from './ui/view';

if (document.readyState === 'complete') {
	view(state(events()));
} else {
	window.addEventListener('DOMContentLoaded', function () {
		view(state(events()));
	});
}
