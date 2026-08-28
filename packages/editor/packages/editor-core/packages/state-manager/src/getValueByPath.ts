import type { Path, PathValue } from './types';

/**
 * Retrieves a value from the state object by following a dot-separated path.
 * @param state The root state object
 * @param selector The path selector (e.g., 'settings.theme' or 'user.name')
 * @returns The value at the path, or undefined if not found
 */
export function getValueByPath<State, P extends Path<State>>(state: State, selector: P): PathValue<State, P> {
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

	return currentValue as PathValue<State, P>;
}
