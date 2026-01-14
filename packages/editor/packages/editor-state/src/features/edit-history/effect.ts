import { StateManager } from '@8f4e/state-manager';

import { type EventDispatcher, type State } from '../../types';
import serializeToProject from '../project-export/serializeToProject';

export default function historyTracking(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();
	if (!state.featureFlags.historyTracking) {
		return;
	}

	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	const DEBOUNCE_DELAY = 1000;

	function saveHistory() {
		if (state.historyStack.length >= 10) {
			state.historyStack.shift();
		}

		state.historyStack.push(serializeToProject(state, { includeCompiled: false }));
		state.redoStack = [];
	}

	function onCodeChange() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		saveTimeout = setTimeout(() => {
			saveHistory();
			saveTimeout = null;
		}, DEBOUNCE_DELAY);
	}

	function undo() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}

		const previousState = state.historyStack.pop();
		if (previousState) {
			if (state.redoStack.length >= 10) {
				state.redoStack.shift();
			}
			state.redoStack.push(serializeToProject(state));
			events.dispatch('loadProject', { project: previousState });
		}
	}

	function redo() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}

		const nextState = state.redoStack.pop();
		if (nextState) {
			if (state.historyStack.length >= 10) {
				state.historyStack.shift();
			}
			state.historyStack.push(serializeToProject(state, { includeCompiled: false }));
			events.dispatch('loadProject', { project: nextState });
		}
	}

	store.subscribe('graphicHelper.selectedCodeBlock.code', onCodeChange);
	events.on('undo', undo);
	events.on('redo', redo);
}
