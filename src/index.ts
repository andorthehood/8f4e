import events from './ui/events';
import state from './ui/state';
import view from './ui/view';

window.addEventListener('DOMContentLoaded', function () {
	view(state(events()));
});
