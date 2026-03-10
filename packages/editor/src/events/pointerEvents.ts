import { EventDispatcher } from '.';

import type { State, InternalMouseEvent } from '@8f4e/editor-state';

const WHEEL_SCROLL_END_DELAY_MS = 120;

export default function pointerEvents(element: HTMLElement, events: EventDispatcher, state: State): () => void {
	let prevEvent = {
		offsetX: 0,
		offsetY: 0,
	};
	let wheelScrollEndTimeout: ReturnType<typeof setTimeout> | undefined;

	function onMouseEvents(event: MouseEvent) {
		const movementX = event.offsetX - prevEvent.offsetX;
		const movementY = event.offsetY - prevEvent.offsetY;
		prevEvent = event;

		const { offsetX, offsetY, type, buttons, altKey } = event;

		event.preventDefault();

		const eventObject = {
			x: offsetX,
			y: offsetY,
			movementX,
			movementY,
			buttons,
			stopPropagation: false,
			canvasWidth: element.clientWidth,
			canvasHeight: element.clientHeight,
			altKey,
		};

		events.dispatch<InternalMouseEvent>(type, eventObject);
	}

	function onWheelEvents(event: WheelEvent) {
		event.preventDefault();

		events.dispatch<InternalMouseEvent>('mousemove', {
			x: event.offsetX,
			y: event.offsetY,
			movementX: event.deltaX * -1,
			movementY: event.deltaY * -1,
			buttons: 1,
			stopPropagation: false,
			canvasWidth: element.clientWidth,
			canvasHeight: element.clientHeight,
			altKey: event.altKey,
		});

		if (wheelScrollEndTimeout) {
			clearTimeout(wheelScrollEndTimeout);
		}

		wheelScrollEndTimeout = setTimeout(() => {
			wheelScrollEndTimeout = undefined;
			events.dispatch('mouseup');
		}, WHEEL_SCROLL_END_DELAY_MS);
	}

	if (state.featureFlags.viewportDragging) {
		window.addEventListener('wheel', onWheelEvents, { passive: false });
	}
	element.addEventListener('mouseup', onMouseEvents);
	element.addEventListener('mousedown', onMouseEvents);
	element.addEventListener('mousemove', onMouseEvents);
	element.addEventListener('contextmenu', onMouseEvents);

	return () => {
		if (wheelScrollEndTimeout) {
			clearTimeout(wheelScrollEndTimeout);
		}

		if (state.featureFlags.viewportDragging) {
			window.removeEventListener('wheel', onWheelEvents);
		}
		element.removeEventListener('mouseup', onMouseEvents);
		element.removeEventListener('mousedown', onMouseEvents);
		element.removeEventListener('mousemove', onMouseEvents);
		element.removeEventListener('contextmenu', onMouseEvents);
	};
}
