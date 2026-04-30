import { describe, it, vi, expect } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import runtimeEffect from '../effect';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('Runtime System', () => {
	describe('Runtime lifecycle integration', () => {
		it('should destroy previous runtime when runtime type changes without changeRuntime event', async () => {
			const audioDestroyer = vi.fn();
			const mainDestroyer = vi.fn();
			const audioRuntimeFactory = vi.fn(() => audioDestroyer);
			const mainRuntimeFactory = vi.fn(() => mainDestroyer);

			const state = createMockState({
				editorConfig: { runtime: 'AudioWorkletRuntime' },
				runtimeRegistry: {
					AudioWorkletRuntime: {
						id: 'AudioWorkletRuntime',
						defaults: { sampleRate: 44100 },
						schema: { type: 'object', properties: {} },
						factory: audioRuntimeFactory,
					},
					MainThreadRuntime: {
						id: 'MainThreadRuntime',
						defaults: { sampleRate: 60 },
						schema: { type: 'object', properties: {} },
						factory: mainRuntimeFactory,
					},
				},
				defaultRuntimeId: 'AudioWorkletRuntime',
			});

			const store = createStateManager(state);
			const events = createMockEventDispatcherWithVitest();

			await runtimeEffect(store, events);

			store.set('compiler.isCompiling', true);
			store.set('compiler.isCompiling', false);

			// Give the subscription callback time to execute
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(audioRuntimeFactory).toHaveBeenCalledTimes(1);
			expect(audioDestroyer).not.toHaveBeenCalled();

			store.set('editorConfig.runtime', 'MainThreadRuntime');

			// Give the subscription callback time to execute
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(audioDestroyer).toHaveBeenCalledTimes(1);
			expect(mainRuntimeFactory).toHaveBeenCalledTimes(1);

			const destroyOrder = audioDestroyer.mock.invocationCallOrder[0];
			const mainFactoryOrder = mainRuntimeFactory.mock.invocationCallOrder[0];

			expect(destroyOrder).toBeLessThan(mainFactoryOrder);
		});

		it('should switch runtime immediately when runtime selection changes while compiler is idle', async () => {
			const audioDestroyer = vi.fn();
			const webWorkerDestroyer = vi.fn();
			const audioRuntimeFactory = vi.fn(() => audioDestroyer);
			const webWorkerRuntimeFactory = vi.fn(() => webWorkerDestroyer);

			const state = createMockState({
				editorConfig: { runtime: 'AudioWorkletRuntime' },
				runtimeRegistry: {
					AudioWorkletRuntime: {
						id: 'AudioWorkletRuntime',
						defaults: { sampleRate: 44100 },
						schema: { type: 'object', properties: {} },
						factory: audioRuntimeFactory,
					},
					WebWorkerRuntime: {
						id: 'WebWorkerRuntime',
						defaults: { sampleRate: 50 },
						schema: { type: 'object', properties: {} },
						factory: webWorkerRuntimeFactory,
					},
				},
				defaultRuntimeId: 'AudioWorkletRuntime',
			});

			const store = createStateManager(state);
			const events = createMockEventDispatcherWithVitest();

			await runtimeEffect(store, events);

			store.set('compiler.isCompiling', true);
			store.set('compiler.isCompiling', false);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(audioRuntimeFactory).toHaveBeenCalledTimes(1);
			expect(audioDestroyer).not.toHaveBeenCalled();

			store.set('editorConfig.runtime', 'WebWorkerRuntime');

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(audioDestroyer).toHaveBeenCalledTimes(1);
			expect(webWorkerRuntimeFactory).toHaveBeenCalledTimes(1);
		});
	});
});
