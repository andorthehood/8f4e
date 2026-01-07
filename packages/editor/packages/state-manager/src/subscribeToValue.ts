import type { Path, PathValue, Subscription, Matcher } from './types';

export function createSubscribeToValue<State>(subscriptions: Set<Subscription<State>>) {
	return function subscribeToValue<P extends Path<State>>(
		selector: P,
		matcher: Matcher<PathValue<State, P>>,
		callback: (value: PathValue<State, P>) => void
	) {
		const tokens = String(selector).split('.');

		const subscription: Subscription<State, P> = {
			selector,
			tokens,
			callback,
			matcher,
		};
		subscriptions.add(subscription as unknown as Subscription<State>);
		return subscription;
	};
}
