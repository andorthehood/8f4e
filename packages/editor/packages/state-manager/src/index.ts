import type { Path, PathValue, Subscription } from './types';

export interface StateManager<State> {
	getState: () => State;
	set: <P extends Path<State>>(selector: P, value: PathValue<State, P>) => void;
	subscribe: <P extends Path<State>>(
		selector: P,
		callback: (value: PathValue<State, P>) => void
	) => Subscription<State, P>;
	unsubscribe: <P extends Path<State>>(selector: P, callback: (value: PathValue<State, P>) => void) => void;
	waitForChange: <P extends Path<State>>(selector: P) => Promise<PathValue<State, P>>;
	waitForValue: <P extends Path<State>>(
		selector: P,
		expectedValue: PathValue<State, P>
	) => Promise<PathValue<State, P>>;
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
		waitForChange<P extends Path<State>>(selector: P): Promise<PathValue<State, P>> {
			return new Promise(resolve => {
				const callback = (value: PathValue<State, P>) => {
					this.unsubscribe(selector, callback);
					resolve(value);
				};
				this.subscribe(selector, callback);
			});
		},
		waitForValue<P extends Path<State>>(selector: P, expectedValue: PathValue<State, P>): Promise<PathValue<State, P>> {
			return new Promise(resolve => {
				// Get the current value
				const tokens = String(selector).split('.');
				let currentValue: unknown = state;
				for (const token of tokens) {
					if (currentValue === null) {
						currentValue = undefined;
						break;
					}

					if (typeof currentValue === 'object' || typeof currentValue === 'function') {
						currentValue = (currentValue as Record<string, unknown>)[token];
					} else {
						currentValue = undefined;
						break;
					}
				}

				// If the current value already matches, resolve immediately
				if (currentValue === expectedValue) {
					resolve(currentValue as PathValue<State, P>);
					return;
				}

				// Otherwise, subscribe and wait for the expected value
				const callback = (value: PathValue<State, P>) => {
					if (value === expectedValue) {
						this.unsubscribe(selector, callback);
						resolve(value);
					}
				};
				this.subscribe(selector, callback);
			});
		},
	};
}

export default createStateManager;
