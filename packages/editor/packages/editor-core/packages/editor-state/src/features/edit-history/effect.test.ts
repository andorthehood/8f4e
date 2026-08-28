import createStateManager from '@8f4e/state-manager';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '../../pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../../pureHelpers/testingUtils/vitestTestUtils';
import historyTracking from './effect';

describe('history tracking effect', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('cancels a pending history snapshot when disposed', async () => {
		const state = createMockState({
			featureFlags: { historyTracking: true },
		});
		state.codeBlockRendering.selectedCodeBlock = createMockCodeBlock({
			code: ['function main', 'functionEnd'],
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();
		const dispose = historyTracking(store, events);

		store.set('codeBlockRendering.selectedCodeBlock.code', ['function main', 'functionEnd']);
		dispose?.();
		await vi.advanceTimersByTimeAsync(1000);

		expect(state.historyStack).toEqual([]);
	});
});
