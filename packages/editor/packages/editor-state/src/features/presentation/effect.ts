import { getPresentationStops } from './directives';

import centerViewportOnCodeBlock from '../viewport/centerViewportOnCodeBlock';

import type { StateManager } from '@8f4e/state-manager';
import type { EventDispatcher, State } from '~/types';

function centerCurrentStop(
	store: StateManager<State>,
	state: State,
	events: EventDispatcher,
	stop: ReturnType<typeof getPresentationStops>[number] | undefined
): void {
	if (!stop) {
		return;
	}

	store.set('graphicHelper.selectedCodeBlock', stop.codeBlock);
	centerViewportOnCodeBlock(state.viewport, stop.codeBlock);
	events.dispatch('viewportMoved');
}

export default function presentation(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();
	let stops = getPresentationStops(state.graphicHelper.codeBlocks);
	let stopIndex = 0;
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	function clearScheduledAdvance(): void {
		if (!timeoutId) {
			return;
		}

		clearTimeout(timeoutId);
		timeoutId = undefined;
	}

	function exitPresentation(): void {
		clearScheduledAdvance();
		if (state.editorMode === 'presentation') {
			store.set('editorMode', 'view');
		}
	}

	function scheduleNextAdvance(): void {
		clearScheduledAdvance();
		if (state.editorMode !== 'presentation' || stops.length <= 1) {
			return;
		}

		timeoutId = setTimeout(() => {
			if (state.editorMode !== 'presentation' || stops.length === 0) {
				return;
			}

			stopIndex = (stopIndex + 1) % stops.length;
			centerCurrentStop(store, state, events, stops[stopIndex]);
			scheduleNextAdvance();
		}, stops[stopIndex].seconds * 1000);
	}

	function syncStops(): void {
		const currentStop = stops[stopIndex];
		stops = getPresentationStops(state.graphicHelper.codeBlocks);

		if (state.editorMode !== 'presentation') {
			return;
		}

		if (stops.length === 0) {
			exitPresentation();
			return;
		}

		const nextIndex = currentStop
			? stops.findIndex(stop => stop.codeBlock.creationIndex === currentStop.codeBlock.creationIndex)
			: -1;
		stopIndex = nextIndex >= 0 ? nextIndex : 0;
		centerCurrentStop(store, state, events, stops[stopIndex]);
		scheduleNextAdvance();
	}

	function onPresentationChanged(editorMode: State['editorMode']): void {
		clearScheduledAdvance();
		if (editorMode !== 'presentation') {
			return;
		}

		stops = getPresentationStops(state.graphicHelper.codeBlocks);
		if (stops.length === 0) {
			store.set('editorMode', 'view');
			return;
		}

		stopIndex = 0;
		centerCurrentStop(store, state, events, stops[stopIndex]);
		scheduleNextAdvance();
	}

	function onViewportResized(): void {
		if (state.editorMode !== 'presentation' || stops.length === 0) {
			return;
		}

		centerCurrentStop(store, state, events, stops[stopIndex]);
	}

	store.subscribe('editorMode', onPresentationChanged);
	store.subscribe('graphicHelper.codeBlocks', syncStops);
	events.on('viewportResized', onViewportResized);

	return () => {
		clearScheduledAdvance();
		store.unsubscribe('editorMode', onPresentationChanged);
		store.unsubscribe('graphicHelper.codeBlocks', syncStops);
		events.off('viewportResized', onViewportResized);
	};
}
