import type { EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import getExportBaseName from '../project-export/getExportBaseName';

export default function canvasScreenshot(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();
	let disposed = false;

	async function onExportCanvasScreenshot() {
		if (disposed) {
			return;
		}

		if (!state.callbacks.exportCanvasScreenshot) {
			console.warn('No exportCanvasScreenshot callback provided');
			return;
		}

		const previousModeOverlay = state.featureFlags.modeOverlay;
		const previousOffscreenBlockArrows = state.featureFlags.offscreenBlockArrows;
		const fileName = `${getExportBaseName(state)}.png`;

		try {
			store.set('featureFlags.modeOverlay', false);
			store.set('featureFlags.offscreenBlockArrows', false);
			await state.callbacks.exportCanvasScreenshot(fileName);
		} catch (error) {
			if (!disposed) {
				console.error('Failed to export canvas screenshot:', error);
			}
		} finally {
			if (!disposed) {
				store.set('featureFlags.modeOverlay', previousModeOverlay);
				store.set('featureFlags.offscreenBlockArrows', previousOffscreenBlockArrows);
			}
		}
	}

	events.on('exportCanvasScreenshot', onExportCanvasScreenshot);

	return () => {
		disposed = true;
		events.off('exportCanvasScreenshot', onExportCanvasScreenshot);
	};
}
