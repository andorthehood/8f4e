import { StateManager } from '@8f4e/state-manager';

import getExportBaseName from '../project-export/getExportBaseName';

import type { State, EventDispatcher } from '@8f4e/editor-state-types';

export default function canvasScreenshot(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	async function onExportCanvasScreenshot() {
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
			console.error('Failed to export canvas screenshot:', error);
		} finally {
			store.set('featureFlags.modeOverlay', previousModeOverlay);
			store.set('featureFlags.offscreenBlockArrows', previousOffscreenBlockArrows);
		}
	}

	events.on('exportCanvasScreenshot', onExportCanvasScreenshot);
}
