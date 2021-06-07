export interface EventObject {
	x: number;
	y: number;
	movementX: number;
	movementY: number;
	buttons: {};
	stopPropagation: boolean;
	key: number;
}

export type EventHandler = (event: EventObject) => void;

export default function events(): {
	on: (event: string, callback: EventHandler) => void;
	off: (event: string, callback: EventHandler) => void;
	dispatch: (event: string, eventObject: {}) => void;
} {
	const subscriptions = {
		contextmenu: [],
		keydown: [],
		keyup: [],
		mousedown: [],
		mousemove: [],
		mouseup: [],
		resize: [],
	};

	function onEvent(event) {
		const { clientX, clientY, movementX, movementY, type, buttons, which } = event;
		event.preventDefault();
		const eventObject: EventObject = {
			x: clientX,
			y: clientY,
			movementX,
			movementY,
			buttons,
			stopPropagation: false,
			key: which,
		};
		for (let i = 0; i < subscriptions[type].length; i++) {
			if (!eventObject.stopPropagation) {
				subscriptions[type][i](eventObject);
			}
		}
	}

	Object.keys(subscriptions).forEach(function (event: any) {
		if (event === 'resize') {
			window.addEventListener(event, onEvent);
		} else {
			document.addEventListener(event, onEvent);
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

	function dispatch(type: string, eventObject: {} = {}): void {
		if (!subscriptions[type]) {
			return console.warn('No subscription to event type:', type);
		}
		for (let i = 0; i < subscriptions[type].length; i++) {
			subscriptions[type][i](eventObject);
		}
	}

	return { on, off, dispatch };
}
