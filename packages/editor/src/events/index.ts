export type EventHandler<T> = (event: T) => void;

export interface EventDispatcher {
	on: <T>(eventName: string, callback: EventHandler<T>) => void;
	off: <T>(eventName: string, callback: EventHandler<T>) => void;
	dispatch: <T>(eventName: string, eventObject?: T) => void;
}

export default function events(): EventDispatcher {
	const subscriptions = {};

	function on(eventName, callback) {
		if (!subscriptions[eventName]) {
			subscriptions[eventName] = [];
		}
		subscriptions[eventName].push(callback);
	}

	function off(eventName, callback) {
		if (subscriptions[eventName].indexOf(callback) === -1) {
			return;
		}
		subscriptions[eventName].splice(subscriptions[eventName].indexOf(callback), 1);
	}

	function dispatch(type, eventObject) {
		if (!subscriptions[type]) {
			return console.warn('No subscription to event type:', type);
		}
		for (let i = 0; i < subscriptions[type].length; i++) {
			if (eventObject && eventObject.stopPropagation) {
				return;
			}
			subscriptions[type][i](eventObject);
		}
	}

	return { on, off, dispatch };
}
