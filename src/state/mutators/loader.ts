import { State } from '../types';

export default function loader(state: State, events, defaultState) {
	const localState = JSON.parse(localStorage.getItem('state')) || {};

	Object.keys(localState).forEach(key => {
		state[key] = localState[key] || defaultState[key];
	});

	if (state.sructureVersion !== defaultState.sructureVersion) {
		Object.keys(defaultState).forEach(key => {
			state[key] = defaultState[key];
		});
	}
	state.history = [];

	// @ts-ignore
	window.state = state;

	const onSaveState = () => {
		localStorage.setItem(
			'state',
			JSON.stringify({
				connections: state.connections,
				modules: state.modules,
				sructureVersion: state.sructureVersion,
				viewport: state.viewport,
			})
		);
	};

	const onOpenFile = () => {};

	events.on('saveState', onSaveState);
	events.on('open', onOpenFile);
}
