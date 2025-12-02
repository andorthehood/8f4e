import { move, resize, snapToGrid } from '../impureHelpers/viewport/viewport';
import { EventDispatcher } from '../types';

import type { State } from '../types';

interface MouseMoveEvent {
	buttons: number;
	movementX: number;
	movementY: number;
}

interface ResizeEvent {
	canvasWidth: number;
	canvasHeight: number;
}

export default function viewport(state: State, events: EventDispatcher): () => void {
	function onMouseMove(event: MouseMoveEvent) {
		if (event.buttons === 1 && state.featureFlags.viewportDragging) {
			// Disable animation when user manually drags viewport
			state.featureFlags.viewportAnimations = false;
			move(state, event.movementX, event.movementY);
		}
	}

	function onResize(event: ResizeEvent) {
		resize(state, event.canvasWidth, event.canvasHeight);
	}

	function onMouseUp() {
		snapToGrid(state);
	}

	events.on('mousemove', onMouseMove);
	events.on('resize', onResize);
	events.on('mouseup', onMouseUp);

	return () => {
		events.off('mousemove', onMouseMove);
		events.off('resize', onResize);
		events.off('mouseup', onMouseUp);
	};
}
