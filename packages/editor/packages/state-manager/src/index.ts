import { createSet } from './set';
import { createSubscribe } from './subscribe';
import { createSubscribeToValue } from './subscribeToValue';
import { createUnsubscribe } from './unsubscribe';
import { createWaitForChange } from './waitForChange';
import { createWaitForValue } from './waitForValue';

import type { Path, PathValue, Subscription, Matcher } from './types';

export type { Path, PathValue, Subscription, Matcher };

export interface StateManager<State> {
	getState: () => State;
	set: <P extends Path<State>>(selector: P, value: PathValue<State, P>) => void;
	subscribe: <P extends Path<State>>(
		selector: P,
		callback: (value: PathValue<State, P>) => void
	) => Subscription<State, P>;
	subscribeToValue: <P extends Path<State>>(
		selector: P,
		matcher: Matcher<PathValue<State, P>>,
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

	const set = createSet(state, subscriptions);
	const subscribe = createSubscribe(subscriptions);
	const subscribeToValue = createSubscribeToValue(subscriptions);
	const unsubscribe = createUnsubscribe(subscriptions);
	const waitForChange = createWaitForChange(subscribe, unsubscribe);
	const waitForValue = createWaitForValue(state, subscribe, unsubscribe);

	return {
		getState: () => state,
		set,
		subscribe,
		subscribeToValue,
		unsubscribe,
		waitForChange,
		waitForValue,
	};
}

export default createStateManager;
