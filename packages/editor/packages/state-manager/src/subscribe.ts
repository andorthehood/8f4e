import type { Path, PathValue, Subscription } from './types';

export function createSubscribe<State>(subscriptions: Set<Subscription<State>>) {
	return function subscribe<P extends Path<State>>(selector: P, callback: (value: PathValue<State, P>) => void) {
		const tokens = String(selector).split('.');

		const subscription: Subscription<State, P> = {
			selector,
			tokens,
			callback,
		};
		subscriptions.add(subscription as unknown as Subscription<State>);
		return subscription;
	};
}
