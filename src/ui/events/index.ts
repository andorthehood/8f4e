export interface EventObject {
	clientX: number;
	clientY: number;
	movementX: number;
	movementY: number;
	buttons: {};
	stopPropagation: boolean;
}

export type EventHandler = (event: EventObject) => void;

const events = function (): {
	on: (event: string, callback: EventHandler) => void;
	off: (event: string, callback: EventHandler) => void;
	dispatch: (event: string, eventObject: {}) => void;
} {
	const subscriptions = {
		contextmenu: [],
		mousedown: [],
		mousemove: [],
		mouseup: [],
		resize: [],
	};

	const onEvent = function (event) {
		const { clientX, clientY, movementX, movementY, type, buttons } = event;
		event.preventDefault();
		const eventObject: EventObject = { clientX, clientY, movementX, movementY, buttons, stopPropagation: false };
		for (let i = 0; i < subscriptions[type].length; i++) {
			if (!eventObject.stopPropagation) {
				subscriptions[type][i](eventObject);
			}
		}
	};

	Object.keys(subscriptions).forEach(function (event: any) {
		if (event === 'resize') {
			window.addEventListener(event, onEvent);
		} else {
			document.addEventListener(event, onEvent);
		}
	});

	const on = function (eventName: string, callback: EventHandler): void {
		if (!subscriptions[eventName]) {
			subscriptions[eventName] = [];
		}
		subscriptions[eventName].push(callback);
	};

	const off = function (eventName: string, callback: EventHandler): void {
		subscriptions[eventName].splice(subscriptions[eventName].indexOf(callback), 1);
	};

	const dispatch = function (type: string, eventObject: {} = {}): void {
		for (let i = 0; i < subscriptions[type].length; i++) {
			subscriptions[type][i](eventObject);
		}
	};

	return { on, off, dispatch };
};

export default events;
