import { getValueByPath } from './getValueByPath';

import type { Path, PathValue, Subscription } from './types';

export function createSet<State>(state: State, subscriptions: Set<Subscription<State>>) {
	return function set<P extends Path<State>>(selector: P, value: PathValue<State, P>) {
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

			const target = getValueByPath(state, subscription.selector);
			(callback as (value: unknown) => void)(target);
		});
	};
}
