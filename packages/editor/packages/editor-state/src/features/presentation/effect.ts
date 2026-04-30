import { getPresentationStops } from './directives';

import animateViewport, { stopViewportAnimation } from '../viewport/animateViewport';
import centerViewportOnCodeBlock from '../viewport/centerViewportOnCodeBlock';

import type { StateManager } from '@8f4e/state-manager';
import type { EventDispatcher, State } from '@8f4e/editor-state-types';

const PRESENTATION_TRANSITION_DURATION_MS = 2000;

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
	const { x, y } = centerViewportOnCodeBlock(state.viewport, stop.codeBlock, {
		alignment: stop.alignment,
	});
	animateViewport(state, x, y, events);
}

export default function presentation(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();
	let stops = getPresentationStops(state.graphicHelper.codeBlocks);
	let stopIndex = 0;
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	let returnToViewportTimeoutId: ReturnType<typeof setTimeout> | undefined;
	let presentationStartViewport: { x: number; y: number } | undefined;
	let isReturningToStartViewport = false;

	function refreshStops(): void {
		stops = getPresentationStops(state.graphicHelper.codeBlocks);
		state.presentation.canPresent = stops.length > 0;
	}

	function clearPresentationState(options: { preserveActiveStopIndex?: boolean } = {}): void {
		if (!options.preserveActiveStopIndex) {
			state.presentation.activeStopIndex = 0;
		}
		state.presentation.totalStops = 0;
		state.presentation.remainingMs = 0;
		state.presentation.currentStopDurationMs = 0;
		state.presentation.deadlineAt = undefined;
	}

	function updatePresentationState(seconds: number): void {
		const durationMs = Math.round(seconds * 1000);
		state.presentation.activeStopIndex = stopIndex;
		state.presentation.totalStops = stops.length;
		state.presentation.remainingMs = durationMs;
		state.presentation.currentStopDurationMs = durationMs;
		state.presentation.deadlineAt = Date.now() + durationMs;
	}

	function clearScheduledAdvance(): void {
		if (!timeoutId) {
			return;
		}

		clearTimeout(timeoutId);
		timeoutId = undefined;
	}

	function clearReturnToViewportTimeout(): void {
		if (!returnToViewportTimeoutId) {
			return;
		}

		clearTimeout(returnToViewportTimeoutId);
		returnToViewportTimeoutId = undefined;
	}

	function exitPresentation(options: { restoreStartViewport?: boolean } = {}): void {
		clearScheduledAdvance();
		clearReturnToViewportTimeout();
		isReturningToStartViewport = false;
		if (options.restoreStartViewport && presentationStartViewport) {
			isReturningToStartViewport = true;
			store.set('graphicHelper.selectedCodeBlock', undefined);
			animateViewport(state, presentationStartViewport.x, presentationStartViewport.y, events);
			returnToViewportTimeoutId = setTimeout(() => {
				isReturningToStartViewport = false;
				returnToViewportTimeoutId = undefined;
			}, PRESENTATION_TRANSITION_DURATION_MS);
		} else {
			stopViewportAnimation(state);
		}
		clearPresentationState();
		if (state.editorMode === 'presentation') {
			store.set('editorMode', 'view');
		}
	}

	function jumpToStop(indexDelta: number): void {
		if (state.editorMode !== 'presentation' || stops.length === 0) {
			return;
		}

		stopIndex = (stopIndex + indexDelta + stops.length) % stops.length;
		centerCurrentStop(store, state, events, stops[stopIndex]);
		scheduleNextAdvance();
	}

	function scheduleNextAdvance(): void {
		clearScheduledAdvance();
		if (state.editorMode !== 'presentation' || stops.length === 0) {
			return;
		}

		updatePresentationState(stops[stopIndex].seconds);

		if (stops.length <= 1) {
			return;
		}

		timeoutId = setTimeout(() => {
			if (state.editorMode !== 'presentation' || stops.length === 0) {
				return;
			}

			if (stopIndex >= stops.length - 1) {
				exitPresentation({ restoreStartViewport: true });
				return;
			}

			stopIndex += 1;
			centerCurrentStop(store, state, events, stops[stopIndex]);
			scheduleNextAdvance();
		}, stops[stopIndex].seconds * 1000);
	}

	function syncStops(): void {
		const currentStop = stops[stopIndex];
		refreshStops();

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
			if (!isReturningToStartViewport) {
				stopViewportAnimation(state);
			}
			clearPresentationState({ preserveActiveStopIndex: true });
			presentationStartViewport = undefined;
			return;
		}

		refreshStops();
		if (stops.length === 0) {
			store.set('editorMode', 'view');
			return;
		}

		presentationStartViewport = {
			x: state.viewport.x,
			y: state.viewport.y,
		};
		state.viewportAnimation.durationMs = PRESENTATION_TRANSITION_DURATION_MS;
		stopIndex = Math.min(state.presentation.activeStopIndex, stops.length - 1);
		centerCurrentStop(store, state, events, stops[stopIndex]);
		scheduleNextAdvance();
	}

	function onViewportResized(): void {
		if (state.editorMode !== 'presentation' || stops.length === 0) {
			return;
		}

		centerCurrentStop(store, state, events, stops[stopIndex]);
	}

	function onPreviousPresentationStop(): void {
		jumpToStop(-1);
	}

	function onNextPresentationStop(): void {
		jumpToStop(1);
	}

	store.subscribe('editorMode', onPresentationChanged);
	store.subscribe('graphicHelper.codeBlocks', syncStops);
	events.on('viewportResized', onViewportResized);
	events.on('previousPresentationStop', onPreviousPresentationStop);
	events.on('nextPresentationStop', onNextPresentationStop);
	refreshStops();

	return () => {
		clearScheduledAdvance();
		clearReturnToViewportTimeout();
		stopViewportAnimation(state);
		clearPresentationState();
		store.unsubscribe('editorMode', onPresentationChanged);
		store.unsubscribe('graphicHelper.codeBlocks', syncStops);
		events.off('viewportResized', onViewportResized);
		events.off('previousPresentationStop', onPreviousPresentationStop);
		events.off('nextPresentationStop', onNextPresentationStop);
	};
}
