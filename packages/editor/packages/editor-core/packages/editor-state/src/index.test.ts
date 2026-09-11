import { describe, expect, it, vi } from 'vitest';
import initState from './index';
import { createMockEventDispatcherWithVitest } from './pureHelpers/testingUtils/vitestTestUtils';

describe('editor state lifecycle', () => {
	it('initializes the requested editor mode and synchronizes editing', () => {
		const events = createMockEventDispatcherWithVitest();
		const store = initState(events, {
			callbacks: { loadSession: async () => null },
			initialEditorMode: 'edit',
			runtimeRegistry: {},
		});

		expect(store.getState().editorMode).toBe('edit');
		expect(store.getState().featureFlags.editing).toBe(true);

		store.dispose();
	});

	it('enables browser-local notes by default and allows disabling them at initialization', () => {
		const enabledEvents = createMockEventDispatcherWithVitest();
		const enabledStore = initState(enabledEvents, {
			callbacks: { loadSession: async () => null },
			runtimeRegistry: {},
		});
		const disabledEvents = createMockEventDispatcherWithVitest();
		const disabledStore = initState(disabledEvents, {
			callbacks: { loadSession: async () => null },
			runtimeRegistry: {},
			featureFlags: { browserLocalNotes: false },
		});

		expect(enabledStore.getState().featureFlags.browserLocalNotes).toBe(true);
		expect(disabledStore.getState().featureFlags.browserLocalNotes).toBe(false);
		const enabledProjectPopulatedHandlers = vi
			.mocked(enabledEvents.on)
			.mock.calls.filter(([eventName]) => eventName === 'projectCodeBlocksPopulated');
		const disabledProjectPopulatedHandlers = vi
			.mocked(disabledEvents.on)
			.mock.calls.filter(([eventName]) => eventName === 'projectCodeBlocksPopulated');
		expect(enabledProjectPopulatedHandlers).toHaveLength(disabledProjectPopulatedHandlers.length + 1);

		enabledStore.dispose();
		disabledStore.dispose();
	});

	it('disposes initialized effects and their active runtime exactly once', async () => {
		const runtimeDestroyer = vi.fn();
		const runtimeFactory = vi.fn(() => runtimeDestroyer);
		const events = createMockEventDispatcherWithVitest();
		const store = initState(events, {
			callbacks: { loadSession: async () => null },
			runtimeRegistry: {
				TestRuntime: {
					id: 'TestRuntime',
					factory: runtimeFactory,
				},
			},
		});

		store.getState().editorConfig.runtime = 'TestRuntime';
		store.set('compiler.isCompiling', false);
		await Promise.resolve();
		store.dispose();
		store.dispose();

		expect(runtimeFactory).toHaveBeenCalledOnce();
		expect(runtimeDestroyer).toHaveBeenCalledOnce();
	});
});
