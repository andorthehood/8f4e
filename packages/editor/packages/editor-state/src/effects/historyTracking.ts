import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';
import { serializeToProject } from '../helpers/projectSerializer';

import type { State } from '../types';

export default function historyTracking(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();
	if (!state.featureFlags.historyTracking) {
		return;
	}

	function onSaveHistory() {
		if (state.history.length >= 10) {
			state.history.shift();
		}

		state.history.push(serializeToProject(state, { includeCompiled: false }));
	}

	function undo() {
		const previousState = state.history.pop();
		if (previousState) {
			events.dispatch('loadProject', { project: previousState });
		}
	}

	store.subscribe('graphicHelper.selectedCodeBlock.code', onSaveHistory);
	events.on('undo', undo);
}
