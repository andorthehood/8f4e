export type EventHandler<T> = (event: T) => void;

export interface EventDispatcher {
	on: <T>(eventName: string, callback: EventHandler<T>) => void;
	off: <T>(eventName: string, callback: EventHandler<T>) => void;
	dispatch: <T>(eventName: string, eventObject?: T) => void;
}

export default function events(): EventDispatcher {
	const subscriptions: Record<string, EventHandler<any>[]> = {};

	function on<T>(eventName: string, callback: EventHandler<T>): void {
		if (!subscriptions[eventName]) {
			subscriptions[eventName] = [];
		}
		subscriptions[eventName].push(callback);
	}

	function off<T>(eventName: string, callback: EventHandler<T>): void {
		if (subscriptions[eventName]?.indexOf(callback) === -1) {
			return;
		}
		subscriptions[eventName]?.splice(subscriptions[eventName].indexOf(callback), 1);
	}

	function dispatch<T>(type: string, eventObject?: T): void {
		if (!subscriptions[type]) {
			return console.warn('No subscription to event type:', type);
		}
		for (let i = 0; i < subscriptions[type].length; i++) {
			if (eventObject && (eventObject as any).stopPropagation) {
				return;
			}
			subscriptions[type][i](eventObject);
		}
	}

	return { on, off, dispatch };
}
