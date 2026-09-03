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
		expect(enabledEvents.on).toHaveBeenCalledWith('projectCodeBlocksPopulated', expect.any(Function));
		expect(disabledStore.getState().featureFlags.browserLocalNotes).toBe(false);
		expect(disabledEvents.on).not.toHaveBeenCalledWith('projectCodeBlocksPopulated', expect.any(Function));

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
