import { EventDispatcher } from '.';

import type { State, InternalMouseEvent, InternalKeyboardEvent } from '@8f4e/editor-state-types';

export default function humanInterface(element: HTMLElement, events: EventDispatcher, state: State) {
	function onKeyboardEvents(event: KeyboardEvent) {
		const { key, type } = event;

		event.preventDefault();

		events.dispatch<InternalKeyboardEvent>(type, {
			key,
		});
	}

	let prevEvent = {
		offsetX: 0,
		offsetY: 0,
	};

	function onMouseEvents(event: MouseEvent) {
		const movementX = event.offsetX - prevEvent.offsetX;
		const movementY = event.offsetY - prevEvent.offsetY;
		prevEvent = event;

		const { offsetX, offsetY, type, buttons } = event;

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
		});
	}

	window.addEventListener('keyup', onKeyboardEvents);
	window.addEventListener('keydown', onKeyboardEvents);

	if (state.featureFlags.viewportDragging) {
		window.addEventListener('wheel', onWheelEvents, { passive: false });
	}
	element.addEventListener('mouseup', onMouseEvents);
	element.addEventListener('mousedown', onMouseEvents);
	element.addEventListener('mousemove', onMouseEvents);
	element.addEventListener('contextmenu', onMouseEvents);
}
