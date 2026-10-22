import type { EventDispatcher, State } from '@8f4e/editor-state-types';
import type { ProjectObjectModel } from '@8f4e/language-spec';
import type { StateManager } from '@8f4e/state-manager';

import serializeToProject from '../project-export/serializeToProject';

const DEBOUNCE_DELAY = 1000;
const HISTORY_LIMIT = 10;

/**
 * Serializes a project snapshot with sorted object keys, so snapshots produced
 * by different code paths (serializer, project parser, test fixtures) compare
 * by content rather than by key insertion order.
 */
function stableStringify(value: unknown): string {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value) ?? 'null';
	}

	if (Array.isArray(value)) {
		return `[${value.map(stableStringify).join(',')}]`;
	}

	const record = value as Record<string, unknown>;
	const entries = Object.keys(record)
		.filter(key => record[key] !== undefined)
		.sort()
		.map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`);
	return `{${entries.join(',')}}`;
}

export default function historyTracking(store: StateManager<State>, events: EventDispatcher): void | (() => void) {
	const state = store.getState();
	if (!state.featureFlags.historyTracking) {
		return;
	}

	// The last committed snapshot. While an edit is pending, this remains the
	// before-state; the after-state is captured when the edit commits. Snapshots
	// are deep copies: serialization aliases the live code arrays, and in-place
	// edits (e.g. splicing a directive line) must not leak into them.
	let present: ProjectObjectModel = structuredClone(serializeToProject(state));
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	let editPending = false;

	function cancelPendingEdit() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}
		editPending = false;
	}

	function commitPendingEdit() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}

		if (!editPending) {
			return;
		}
		editPending = false;

		const current = structuredClone(serializeToProject(state));
		if (stableStringify(current) === stableStringify(present)) {
			return;
		}

		if (state.historyStack.length >= HISTORY_LIMIT) {
			state.historyStack.shift();
		}
		state.historyStack.push(present);
		present = current;
	}

	function onProjectChange() {
		// A completed persisted edit invalidates the redo stack immediately,
		// before the debounced commit runs. Selection, caret movement, and
		// navigation never advance projectRevision, so they never reach this.
		state.redoStack = [];
		editPending = true;

		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
		saveTimeout = setTimeout(commitPendingEdit, DEBOUNCE_DELAY);
	}

	function restoreProject(project: ProjectObjectModel) {
		events.dispatch('loadProject', { project, preserveFileAssociation: true });
		present = structuredClone(project);
	}

	function undo() {
		// Commit any pending edit first, so it becomes redo-able.
		commitPendingEdit();

		const previousState = state.historyStack.pop();
		if (!previousState) {
			return;
		}

		if (state.redoStack.length >= HISTORY_LIMIT) {
			state.redoStack.shift();
		}
		state.redoStack.push(present);
		restoreProject(previousState);
	}

	function redo() {
		commitPendingEdit();

		const nextState = state.redoStack.pop();
		if (!nextState) {
			return;
		}

		if (state.historyStack.length >= HISTORY_LIMIT) {
			state.historyStack.shift();
		}
		state.historyStack.push(present);
		restoreProject(nextState);
	}

	function onProjectLoaded(project: ProjectObjectModel | undefined) {
		if (!project) {
			return;
		}

		// Project loads and undo/redo restorations both arrive here. Neither is
		// an ordinary edit: pending work is cancelled and the loaded project
		// becomes the committed baseline without a history entry of its own, and
		// without clearing the redo stack.
		cancelPendingEdit();
		present = structuredClone(project);
	}

	store.subscribe('projectRevision', onProjectChange);
	store.subscribe('initialProjectState', onProjectLoaded);
	events.on('undo', undo);
	events.on('redo', redo);

	return () => {
		cancelPendingEdit();
		store.unsubscribe('projectRevision', onProjectChange);
		store.unsubscribe('initialProjectState', onProjectLoaded);
		events.off('undo', undo);
		events.off('redo', redo);
	};
}
