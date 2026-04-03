import move from './move';
import resize from './resize';
import snapToGrid from './snapToGrid';
import snapToGridConsideringDirection from './snapToGridConsideringDirection';

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
			move(state, event.movementX, event.movementY);
			events.dispatch('viewportMoved');
		}
	}

	function onResize(event: ResizeEvent) {
		resize(state, event.canvasWidth, event.canvasHeight);
		events.dispatch('viewportResized');
	}

	function onMouseUp() {
		snapToGrid(state);
		events.dispatch('viewportMoved');
	}

	function onViewportScrollEnd(event: ViewportScrollEndEvent) {
		snapToGridConsideringDirection(state, event);
		events.dispatch('viewportMoved');
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
