import { StateManager } from '@8f4e/state-manager';

import type { State, EventDispatcher } from '~/types';

/**
 * Handles feature flag toggle events.
 * Currently supports toggling position offsetters at runtime.
 */
export default function featureFlagsEffect(store: StateManager<State>, events: EventDispatcher): void {
	events.on('togglePositionOffsetters', () => {
		const state = store.getState();
		store.set('featureFlags.positionOffsetters', !state.featureFlags.positionOffsetters);
	});
}
