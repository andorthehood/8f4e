import { State } from '../types';

const STRUCTURE_VERSION = 6;

export default function loader(state, events, defaultState) {
	state.ui = { ...defaultState, ...(JSON.parse(localStorage.getItem('state')) || {}) };
	if (state.ui.sructureVersion !== STRUCTURE_VERSION) {
		state.ui = { sructureVersion: STRUCTURE_VERSION, ...onabortdefaultState };
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
