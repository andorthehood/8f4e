import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';
import { serializeToProject } from '../helpers/projectSerializer';

import type { State } from '../types';

export default function historyTracking(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();
	if (!state.featureFlags.historyTracking) {
		return;
	}

	// Capture initial state
	if (state.historyStack.length === 0) {
		state.historyStack.push(serializeToProject(state, { includeCompiled: false }));
	}

	function onSaveHistory() {
		if (state.historyStack.length >= 10) {
			state.historyStack.shift();
		}

		state.historyStack.push(serializeToProject(state, { includeCompiled: false }));
		state.redoStack = [];
	}

	function undo() {
		const previousState = state.historyStack.pop();
		if (previousState) {
			if (state.redoStack.length >= 10) {
				state.redoStack.shift();
			}
			state.redoStack.push(serializeToProject(state));
			events.dispatch('loadProject', { project: previousState });
		}
	}

	// Redo the last action
	function redo() {
		const nextState = state.redoStack.pop();
		if (nextState) {
			if (state.historyStack.length >= 10) {
				state.historyStack.shift();
			}
			state.historyStack.push(serializeToProject(state, { includeCompiled: false }));
			events.dispatch('loadProject', { project: nextState });
		}
	}

	store.subscribe('graphicHelper.selectedCodeBlock.code', onSaveHistory);
	events.on('undo', undo);
	events.on('redo', redo);
}
