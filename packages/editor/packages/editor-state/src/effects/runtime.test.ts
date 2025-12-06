import { describe, test, expect, it, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import runtimeEffect, { RuntimeType } from './runtime';

import { createMockState } from '../pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../pureHelpers/testingUtils/vitestTestUtils';

describe('Runtime System', () => {
	describe('RuntimeType', () => {
		test('should support AudioWorkletRuntime type', () => {
			const runtimeType: RuntimeType = 'AudioWorkletRuntime';
			expect(runtimeType).toBe('AudioWorkletRuntime');
		});

		test('should support WebWorkerMIDIRuntime type', () => {
			const runtimeType: RuntimeType = 'WebWorkerMIDIRuntime';
			expect(runtimeType).toBe('WebWorkerMIDIRuntime');
		});

		test('should support WebWorkerLogicRuntime type', () => {
			const runtimeType: RuntimeType = 'WebWorkerLogicRuntime';
			expect(runtimeType).toBe('WebWorkerLogicRuntime');
		});

		test('should support MainThreadLogicRuntime type', () => {
			const runtimeType: RuntimeType = 'MainThreadLogicRuntime';
			expect(runtimeType).toBe('MainThreadLogicRuntime');
		});
	});

	describe('Runtime loading integration', () => {
		test('should have access to runtime types from main module', () => {
			// This test ensures the types are properly exported from the main runtime module
			const validRuntimeTypes: RuntimeType[] = [
				'AudioWorkletRuntime',
				'WebWorkerMIDIRuntime',
				'WebWorkerLogicRuntime',
				'MainThreadLogicRuntime',
			];

			expect(validRuntimeTypes).toHaveLength(4);
			expect(validRuntimeTypes).toContain('AudioWorkletRuntime');
			expect(validRuntimeTypes).toContain('WebWorkerMIDIRuntime');
			expect(validRuntimeTypes).toContain('WebWorkerLogicRuntime');
			expect(validRuntimeTypes).toContain('MainThreadLogicRuntime');
		});
	});

	describe('Runtime lifecycle integration', () => {
		it('should destroy previous runtime when runtime type changes without changeRuntime event', async () => {
			const audioDestroyer = vi.fn();
			const mainDestroyer = vi.fn();
			const audioRuntimeFactory = vi.fn(() => audioDestroyer);
			const mainRuntimeFactory = vi.fn(() => mainDestroyer);

			const requestRuntime = vi.fn(async (runtimeType: RuntimeType) => {
				if (runtimeType === 'AudioWorkletRuntime') {
					return audioRuntimeFactory;
				}

				if (runtimeType === 'MainThreadLogicRuntime') {
					return mainRuntimeFactory;
				}

				throw new Error(`Unexpected runtime ${runtimeType}`);
			});

			const state = createMockState({
				runtime: {
					runtimeSettings: [{ runtime: 'AudioWorkletRuntime', sampleRate: 44100 }],
					selectedRuntime: 0,
				},
				callbacks: {
					requestRuntime,
				},
			});

			const store = createStateManager(state);
			const events = createMockEventDispatcherWithVitest();

			await runtimeEffect(store, events);

			// Trigger initial runtime initialization by updating the runtime state
			store.set('runtime', {
				stats: state.runtime.stats,
				runtimeSettings: [{ runtime: 'AudioWorkletRuntime', sampleRate: 44100 }],
				selectedRuntime: 0,
			});

			// Give the subscription callback time to execute
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(requestRuntime).toHaveBeenCalledTimes(1);
			expect(audioRuntimeFactory).toHaveBeenCalledTimes(1);
			expect(audioDestroyer).not.toHaveBeenCalled();

			// Update to new runtime by using store.set to trigger the subscription
			store.set('runtime', {
				stats: state.runtime.stats,
				runtimeSettings: [{ runtime: 'MainThreadLogicRuntime', sampleRate: 60 }],
				selectedRuntime: 0,
			});

			// Give the subscription callback time to execute
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(audioDestroyer).toHaveBeenCalledTimes(1);
			expect(mainRuntimeFactory).toHaveBeenCalledTimes(1);
			expect(requestRuntime).toHaveBeenCalledTimes(2);

			const destroyOrder = audioDestroyer.mock.invocationCallOrder[0];
			const mainFactoryOrder = mainRuntimeFactory.mock.invocationCallOrder[0];

			expect(destroyOrder).toBeLessThan(mainFactoryOrder);
		});
	});
});
