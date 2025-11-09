import { vi } from 'vitest';

import type { EventDispatcher } from '../types';
import { createMockEventDispatcher } from './testUtils';

/**
 * Wraps a plain event dispatcher with vitest mocks for testing.
 * This allows tests to use vitest's mock functionality while keeping
 * the base testUtils framework-agnostic.
 */
export function createMockEventDispatcherWithVitest(): EventDispatcher {
	const baseDispatcher = createMockEventDispatcher();
	return {
		on: vi.fn(baseDispatcher.on),
		off: vi.fn(baseDispatcher.off),
		dispatch: vi.fn(baseDispatcher.dispatch),
	};
}
