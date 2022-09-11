import { EventDispatcher } from '../../events';
import { State } from '../types';

export default function loader(state: State, events: EventDispatcher, defaultState: State): void {
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

	function onSaveState() {
		state.modules.forEach(({ type }, index) => {
			if (state.moduleTypes[type].extractState) {
				state.modules[index].state = {
					...state.modules[index].state,
					...state.moduleTypes[type].extractState(
						state.compiler.memoryBuffer,
						state.compiler.memoryAddressLookup[state.modules[index].id].__startAddress
					),
				};
			}
		});

		localStorage.setItem(
			'state',
			JSON.stringify({
				connections: state.connections,
				modules: state.modules,
				sructureVersion: state.sructureVersion,
				viewport: state.viewport,
			})
		);
	}

	events.on('saveState', onSaveState);
}
