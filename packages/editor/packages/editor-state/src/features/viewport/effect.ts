import resize from './resize';
import snapToGrid from './snapToGrid';
import snapToGridConsideringDirection from './snapToGridConsideringDirection';
import updateViewport from './updateViewport';

import type { State } from '~/types';

import { EventDispatcher } from '~/types';

interface MouseMoveEvent {
	buttons: number;
	movementX: number;
	movementY: number;
}

interface ResizeEvent {
	canvasWidth: number;
	canvasHeight: number;
}

interface ViewportScrollEndEvent {
	movementX: number;
	movementY: number;
}

export default function viewport(state: State, events: EventDispatcher): () => void {
	function onMouseMove(event: MouseMoveEvent) {
		if (event.buttons === 1 && state.featureFlags.viewportDragging) {
			updateViewport(
				state,
				viewport => {
					viewport.x -= event.movementX;
					viewport.y -= event.movementY;
				},
				events
			);
		}
	}

	function onResize(event: ResizeEvent) {
		resize(state, event.canvasWidth, event.canvasHeight);
		events.dispatch('viewportResized');
	}

	function onMouseUp() {
		snapToGrid(state, events);
	}

	function onViewportScrollEnd(event: ViewportScrollEndEvent) {
		snapToGridConsideringDirection(state, event, events);
	}

	events.on('mousemove', onMouseMove);
	events.on('resize', onResize);
	events.on('mouseup', onMouseUp);
	events.on('viewportscrollend', onViewportScrollEnd);

	return () => {
		events.off('mousemove', onMouseMove);
		events.off('resize', onResize);
		events.off('mouseup', onMouseUp);
		events.off('viewportscrollend', onViewportScrollEnd);
	};
}
