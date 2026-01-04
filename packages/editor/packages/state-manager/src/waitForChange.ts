import type { Path, PathValue } from './types';

export function createWaitForChange<State>(
	subscribe: <P extends Path<State>>(selector: P, callback: (value: PathValue<State, P>) => void) => unknown,
	unsubscribe: <P extends Path<State>>(selector: P, callback: (value: PathValue<State, P>) => void) => void
) {
	return function waitForChange<P extends Path<State>>(selector: P): Promise<PathValue<State, P>> {
		return new Promise(resolve => {
			const callback = (value: PathValue<State, P>) => {
				unsubscribe(selector, callback);
				resolve(value);
			};
			subscribe(selector, callback);
		});
	};
}
