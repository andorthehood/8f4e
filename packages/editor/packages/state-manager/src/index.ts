import type { Path, PathValue, Subscription } from './types';

export interface StateManager<State> {
	getState: () => State;
	set: <P extends Path<State>>(selector: P, value: PathValue<State, P>) => void;
	subscribe: <P extends Path<State>>(
		selector: P,
		callback: (value: PathValue<State, P>) => void
	) => Subscription<State, P>;
	unsubscribe: <P extends Path<State>>(selector: P, callback: (value: PathValue<State, P>) => void) => void;
}

function createStateManager<State>(state: State): StateManager<State> {
	const subscriptions = new Set<Subscription<State>>();

	return {
		getState: () => state,
		set<P extends Path<State>>(selector: P, value: PathValue<State, P>) {
			const path = String(selector);
			const keys = path.split('.');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let current: any = state;

			if (keys.length === 1) {
				current[keys[0]] = value;
			} else {
				for (let i = 0; i < keys.length - 1; i++) {
					current = current[keys[i]];
				}
				current[keys[keys.length - 1]] = value;
			}

			subscriptions.forEach(subscription => {
				const { tokens, callback } = subscription;
				const comparisonLength = Math.min(tokens.length, keys.length);

				for (let i = 0; i < comparisonLength; i++) {
					if (tokens[i] !== keys[i]) {
						return;
					}
				}

				let target: unknown = state;
				for (const token of tokens) {
					if (target === null) {
						target = undefined;
						break;
					}

					if (typeof target === 'object' || typeof target === 'function') {
						target = (target as Record<string, unknown>)[token];
					} else {
						target = undefined;
						break;
					}
				}

				(callback as (value: unknown) => void)(target);
			});
		},
		subscribe<P extends Path<State>>(selector: P, callback: (value: PathValue<State, P>) => void) {
			const tokens = String(selector).split('.');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const subscription: Subscription<State, P> = {
				selector,
				tokens,
				callback,
			};
			subscriptions.add(subscription as unknown as Subscription<State>);
			return subscription;
		},
		unsubscribe<P extends Path<State>>(selector: P, callback: (value: PathValue<State, P>) => void) {
			for (const subscription of subscriptions) {
				if (subscription.selector === selector && subscription.callback === callback) {
					subscriptions.delete(subscription);
				}
			}
		},
	};
}

export default createStateManager;
