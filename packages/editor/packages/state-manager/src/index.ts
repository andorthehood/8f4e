// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Path<State> = string & Record<never, never>;

type PathValue<State, P extends string> = P extends `${infer K}.${infer Rest}`
	? K extends keyof State
		? PathValue<State[K], Rest>
		: unknown
	: P extends keyof State
		? State[P]
		: unknown;

export type Subscription<State, P extends Path<State> = Path<State>> = [
	selector: P,
	callback: (value: PathValue<State, P>) => void,
];

export interface StateManager<State> {
	getState: () => State;
	set: <P extends Path<State>>(selector: P, value: PathValue<State, P>) => void;
	subscribe: <P extends Path<State>>(
		selector: P,
		callback: (value: PathValue<State, P>) => void
	) => Subscription<State, P>;
	unsubscribe: <P extends Path<State>>(subscription: Subscription<State, P>) => void;
}

function createStateManager<State>(state: State): StateManager<State> {
	const subscriptions = new Set<Subscription<State>>();

	return {
		getState: () => state,
		set<P extends Path<State>>(selector: P, value: PathValue<State, P>) {
			if (typeof selector === 'string' && selector.includes('.')) {
				const keys = selector.split('.');
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				let current = state as any;

				for (let i = 0; i < keys.length - 1; i++) {
					current = current[keys[i]];
				}

				current[keys[keys.length - 1]] = value;
			} else {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(state as any)[selector] = value;
			}

			subscriptions.forEach(subscription => {
				if (selector === subscription[0]) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(subscription[1] as (value: any) => void)(value);
				}
			});
		},
		subscribe<P extends Path<State>>(selector: P, callback: (value: PathValue<State, P>) => void) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const subscription: Subscription<State, P> = [selector, callback as (value: any) => void];
			subscriptions.add(subscription as Subscription<State>);
			return subscription;
		},
		unsubscribe<P extends Path<State>>(subscription: Subscription<State, P>) {
			subscriptions.delete(subscription as Subscription<State>);
		},
	};
}

export default createStateManager;
