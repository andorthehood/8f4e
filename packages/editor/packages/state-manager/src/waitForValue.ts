import { getValueByPath } from './getValueByPath';

import type { Path, PathValue } from './types';

export function createWaitForValue<State>(
	state: State,
	subscribe: <P extends Path<State>>(selector: P, callback: (value: PathValue<State, P>) => void) => unknown,
	unsubscribe: <P extends Path<State>>(selector: P, callback: (value: PathValue<State, P>) => void) => void
) {
	return function waitForValue<P extends Path<State>>(
		selector: P,
		expectedValue: PathValue<State, P>
	): Promise<PathValue<State, P>> {
		return new Promise(resolve => {
			// Get the current value
			const currentValue = getValueByPath(state, selector);

			// If the current value already matches, resolve immediately
			if (currentValue === expectedValue) {
				resolve(currentValue);
				return;
			}

			// Otherwise, subscribe and wait for the expected value
			const callback = (value: PathValue<State, P>) => {
				if (value === expectedValue) {
					unsubscribe(selector, callback);
					resolve(value);
				}
			};
			subscribe(selector, callback);
		});
	};
}
