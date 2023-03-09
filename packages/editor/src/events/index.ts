export interface EventObject {
	x?: number;
	y?: number;
	movementX?: number;
	movementY?: number;
	buttons?: number;
	stopPropagation?: boolean;
	key?: string;
	canvasWidth?: number;
	canvasHeight?: number;
}

export type EventHandler = (event?: EventObject) => void;

export interface EventDispatcher {
	on: (event: string, callback: EventHandler) => void;
	off: (event: string, callback: EventHandler) => void;
	dispatch: (event: string, eventObject?: EventObject) => void;
}

export default function events(element: HTMLElement): EventDispatcher {
	const subscriptions = {
		contextmenu: [],
		keydown: [],
		keyup: [],
		mousedown: [],
		mousemove: [],
		mouseup: [],
	};

	let prevEvent = {
		offsetX: 0,
		offsetY: 0,
	};

	function onEvent(event) {
		const movementX = event.offsetX - prevEvent.offsetX;
		const movementY = event.offsetY - prevEvent.offsetY;
		prevEvent = event;

		const { offsetX, offsetY, type, buttons, key } = event;

		event.preventDefault();
		const eventObject: EventObject = {
			x: offsetX,
			y: offsetY,
			movementX,
			movementY,
			buttons,
			stopPropagation: false,
			key,
			canvasWidth: element.clientWidth,
			canvasHeight: element.clientHeight,
		};
		for (let i = 0; i < subscriptions[type].length; i++) {
			if (!eventObject.stopPropagation) {
				subscriptions[type][i](eventObject);
			}
		}
	}

	Object.keys(subscriptions).forEach(function (event: any) {
		if (['keyup', 'keydown'].includes(event)) {
			window.addEventListener(event, onEvent);
		} else {
			element.addEventListener(event, onEvent);
		}
	});

	function on(eventName: string, callback: EventHandler): void {
		if (!subscriptions[eventName]) {
			subscriptions[eventName] = [];
		}
		subscriptions[eventName].push(callback);
	}

	function off(eventName: string, callback: EventHandler): void {
		if (subscriptions[eventName].indexOf(callback) === -1) {
			return;
		}
		subscriptions[eventName].splice(subscriptions[eventName].indexOf(callback), 1);
	}

	function dispatch(type: string, eventObject: EventObject = {}): void {
		if (!subscriptions[type]) {
			return console.warn('No subscription to event type:', type);
		}
		for (let i = 0; i < subscriptions[type].length; i++) {
			subscriptions[type][i](eventObject);
		}
	}

	return { on, off, dispatch };
}
