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
} {
	const subscriptions = {
		contextmenu: [],
		mousedown: [],
		mousemove: [],
		mouseup: [],
	};

	const onEvent = function ({ clientX, clientY, movementX, movementY, type, buttons }) {
		const eventObject: EventObject = { clientX, clientY, movementX, movementY, buttons, stopPropagation: false };
		for (let i = 0; i < subscriptions[type].length; i++) {
			if (!eventObject.stopPropagation) {
				subscriptions[type][i](eventObject);
			}
		}
	};

	Object.keys(subscriptions).forEach(function (event: any) {
		document.addEventListener(event, onEvent);
	});

	const on = function (eventName: string, callback: EventHandler): void {
		subscriptions[eventName].push(callback);
		console.log(subscriptions);
	};

	const off = function (eventName: string, callback: EventHandler): void {
		subscriptions[eventName].splice(subscriptions[eventName].indexOf(callback), 1);
	};

	return { on, off };
};

export default events;
