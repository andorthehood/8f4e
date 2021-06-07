import { State } from '../types';

export default function loader(state, events, defaultState) {
	state.ui = { ...defaultState, ...(JSON.parse(localStorage.getItem('state')) || {}) };
	if (state.ui.sructureVersion !== defaultState.sructureVersion) {
		state.ui = { ...defaultState };
	}
	state.history = [];

	// @ts-ignore
	window.state = state;

	const onSaveState = () => {
		localStorage.setItem(
			'state',
			JSON.stringify({
				connections: state.ui.connections,
				modules: state.ui.modules,
				sructureVersion: state.ui.sructureVersion,
				viewport: state.ui.viewport,
			})
		);
	};

	const onOpenFile = () => {};

	events.on('saveState', onSaveState);
	events.on('open', onOpenFile);
}
