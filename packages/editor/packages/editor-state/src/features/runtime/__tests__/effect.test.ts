import { describe, it, vi, expect } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import runtimeEffect from '../effect';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('Runtime System', () => {
	describe('Runtime lifecycle integration', () => {
		it('should destroy previous runtime when runtime type changes without changeRuntime event', async () => {
			const audioDestroyer = vi.fn();
			const mainThreadDestroyer = vi.fn();
			const audioRuntimeFactory = vi.fn(() => audioDestroyer);
			const mainThreadRuntimeFactory = vi.fn(() => mainThreadDestroyer);

			const state = createMockState({
				editorConfig: { runtime: 'AudioWorkletRuntime' },
				runtimeRegistry: {
					AudioWorkletRuntime: {
						id: 'AudioWorkletRuntime',
						factory: audioRuntimeFactory,
					},
					MainThreadRuntime: {
						id: 'MainThreadRuntime',
						factory: mainThreadRuntimeFactory,
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
			expect(mainThreadRuntimeFactory).toHaveBeenCalledTimes(1);

			const destroyOrder = audioDestroyer.mock.invocationCallOrder[0];
			const mainThreadFactoryOrder = mainThreadRuntimeFactory.mock.invocationCallOrder[0];

			expect(destroyOrder).toBeLessThan(mainThreadFactoryOrder);
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
						factory: audioRuntimeFactory,
					},
					WebWorkerRuntime: {
						id: 'WebWorkerRuntime',
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

		it('should mirror runtime schema contributions into the generic editor config contribution registry', async () => {
			const state = createMockState({
				editorConfigSchemaContributions: {
					host: {
						root: 'hostSettings',
						schema: { type: 'object', properties: { enabled: { type: 'boolean' } } },
					},
				},
				runtimeRegistry: {
					AudioWorkletRuntime: {
						id: 'AudioWorkletRuntime',
						editorConfigSchema: {
							root: 'audioRuntime',
							schema: { type: 'object', properties: { sampleRate: { type: 'number' } } },
						},
						factory: () => () => {},
					},
					WebWorkerRuntime: {
						id: 'WebWorkerRuntime',
						editorConfigSchema: {
							root: 'workerRuntime',
							schema: { type: 'object', properties: { sampleRate: { type: 'number' } } },
						},
						factory: () => () => {},
					},
				},
				defaultRuntimeId: 'WebWorkerRuntime',
			});

			const store = createStateManager(state);
			const events = createMockEventDispatcherWithVitest();

			await runtimeEffect(store, events);

			expect(Object.keys(store.getState().editorConfigSchemaContributions)).toEqual([
				'host',
				'runtime:WebWorkerRuntime',
				'runtime:AudioWorkletRuntime',
			]);
		});
	});
});
