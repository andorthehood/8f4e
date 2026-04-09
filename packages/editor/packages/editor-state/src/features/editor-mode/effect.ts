import type { StateManager } from '@8f4e/state-manager';
import type { EventDispatcher, State } from '~/types';

export default function editorMode(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function enterEditMode(): void {
		if (state.editorMode !== 'view') {
			return;
		}

		store.set('editorMode', 'edit');
		store.set('featureFlags.editing', true);
		store.set('featureFlags.codeLineSelection', true);
	}

	function enterPresentationMode(): void {
		if (state.editorMode !== 'view') {
			return;
		}

		store.set('editorMode', 'presentation');
		store.set('featureFlags.editing', false);
		store.set('featureFlags.codeLineSelection', false);
	}

	function exitToViewMode(): void {
		if (state.editorMode === 'view') {
			return;
		}

		store.set('editorMode', 'view');
		store.set('featureFlags.editing', false);
		store.set('featureFlags.codeLineSelection', false);
	}

	events.on('enterEditMode', enterEditMode);
	events.on('enterPresentationMode', enterPresentationMode);
	events.on('exitToViewMode', exitToViewMode);
}
