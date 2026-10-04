import createStateManager from '@8f4e/state-manager';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '../../pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../../pureHelpers/testingUtils/vitestTestUtils';
import { EMPTY_DEFAULT_PROJECT } from '../project-import/emptyDefaultProject';
import historyTracking from './effect';

describe('history tracking effect', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('preserves the file association when undoing and redoing project snapshots', () => {
		const state = createMockState({ featureFlags: { historyTracking: true } });
		state.historyStack.push(EMPTY_DEFAULT_PROJECT);
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();
		const dispose = historyTracking(store, events);
		const undo = vi.mocked(events.on).mock.calls.find(call => call[0] === 'undo')![1];
		const redo = vi.mocked(events.on).mock.calls.find(call => call[0] === 'redo')![1];
		undo(undefined);
		expect(events.dispatch).toHaveBeenCalledWith('loadProject', {
			project: EMPTY_DEFAULT_PROJECT,
			preserveFileAssociation: true,
		});
		redo(undefined);
		expect(events.dispatch).toHaveBeenLastCalledWith('loadProject', {
			project: expect.any(Object),
			preserveFileAssociation: true,
		});
		dispose?.();
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
