import { createSet } from './set';
import { createSubscribe } from './subscribe';
import { createSubscribeToValue } from './subscribeToValue';
import { createUnsubscribe } from './unsubscribe';

import type { Path, PathValue, Subscription, Matcher } from './types';

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
}

function createStateManager<State>(state: State): StateManager<State> {
	const subscriptions = new Set<Subscription<State>>();

	const set = createSet(state, subscriptions);
	const subscribe = createSubscribe(subscriptions);
	const subscribeToValue = createSubscribeToValue(subscriptions);
	const unsubscribe = createUnsubscribe(subscriptions);

	return {
		getState: () => state,
		set,
		subscribe,
		subscribeToValue,
		unsubscribe,
	};
}

export default createStateManager;
