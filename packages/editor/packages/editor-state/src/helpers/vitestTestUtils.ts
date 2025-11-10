import { vi } from 'vitest';

import { createMockEventDispatcher } from './testUtils';

import type { EventDispatcher, State } from '../types';
import type { StateManager } from '@8f4e/state-manager';

/**
 * Wraps a plain event dispatcher with vitest mocks for testing.
 * This allows tests to use vitest's mock functionality while keeping
 * the base testUtils framework-agnostic.
 */
export function createMockEventDispatcherWithVitest(): EventDispatcher {
	const baseDispatcher = createMockEventDispatcher();
	return {
		on: vi.fn(baseDispatcher.on) as EventDispatcher['on'],
		off: vi.fn(baseDispatcher.off) as EventDispatcher['off'],
		dispatch: vi.fn(baseDispatcher.dispatch) as EventDispatcher['dispatch'],
	};
}

/**
 * Creates a mock StateManager wrapping a State object for testing.
 * This provides the StateManager interface (getState, subscribe, etc.) needed by effects.
 * @param state The state object to wrap
 * @returns A mocked StateManager with vitest spies
 */
export function createMockStateManager(state: State): StateManager<State> {
	return {
		getState: vi.fn(() => state),
		set: vi.fn(),
		subscribe: vi.fn(),
		unsubscribe: vi.fn(),
	};
}
