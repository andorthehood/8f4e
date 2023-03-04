import { EventDispatcher } from '../../events';
import { State } from '../types';

export default function loader(state: State, events: EventDispatcher, defaultState: State): void {
	const localState = JSON.parse(localStorage.getItem('state') ?? '{}') || {};
	const input = document.createElement('input');
	input.type = 'file';

	function loadState(newState) {
		Object.keys(newState).forEach(key => {
			state[key] = newState[key] || defaultState[key];
		});
	}

	loadState(localState);

	state.history = [];

	// @ts-ignore
	window.state = state;

	function onSaveState() {
		localStorage.setItem(
			'state',
			JSON.stringify({
				connections: state.connections,
				modules: state.modules,
				sructureVersion: state.sructureVersion,
				viewport: state.viewport,
				rnbo: state.rnbo,
			})
		);
	}

	function onOpen() {
		input.click();
	}

	input.addEventListener('change', event => {
		// @ts-ignore
		const file = event.target.files[0];

		// setting up the reader
		const reader = new FileReader();
		reader.readAsText(file, 'UTF-8');

		reader.addEventListener('load', readerEvent => {
			const content = readerEvent.target?.result?.toString();
			if (content) {
				loadState(JSON.parse(content));
				events.dispatch('saveState');
			}
		});
	});

	events.on('saveState', onSaveState);
	events.on('open', onOpen);
}
