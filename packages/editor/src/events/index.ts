export type EventHandler<T> = (event: T) => void;

export interface EventObject {
	stopPropagation?: boolean;
}

export interface EventDispatcher {
	on: <T>(eventName: string, callback: EventHandler<T>) => void;
	off: <T>(eventName: string, callback: EventHandler<T>) => void;
	dispatch: <T>(eventName: string, eventObject?: T) => void;
}

export default function events(): EventDispatcher {
	const subscriptions: Record<string, EventHandler<unknown>[]> = {};

	function on<T>(eventName: string, callback: EventHandler<T>): void {
		if (!subscriptions[eventName]) {
			subscriptions[eventName] = [];
		}
		subscriptions[eventName].push(callback as EventHandler<unknown>);
	}

	function off<T>(eventName: string, callback: EventHandler<T>): void {
		if (subscriptions[eventName]?.indexOf(callback as EventHandler<unknown>) === -1) {
			return;
		}
		subscriptions[eventName]?.splice(subscriptions[eventName].indexOf(callback as EventHandler<unknown>), 1);
	}

	function dispatch<T>(type: string, eventObject?: T): void {
		if (!subscriptions[type]) {
			return console.warn('No subscription to event type:', type);
		}
		for (let i = 0; i < subscriptions[type].length; i++) {
			if (eventObject && (eventObject as EventObject).stopPropagation) {
				return;
			}
			subscriptions[type][i](eventObject);
		}
	}

	return { on, off, dispatch };
}
