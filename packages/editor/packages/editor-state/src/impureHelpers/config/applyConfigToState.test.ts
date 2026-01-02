import { describe, it, expect } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import { applyConfigToState } from './applyConfigToState';

import { createMockState } from '../../pureHelpers/testingUtils/testUtils';

import type { ConfigObject } from './applyConfigToState';

describe('applyConfigToState', () => {
	it('should apply memorySizeBytes', () => {
		const state = createMockState();
		const store = createStateManager(state);
		applyConfigToState(store, { memorySizeBytes: 65536 });
		expect(state.compiler.compilerOptions.memorySizeBytes).toBe(65536);
	});

	it('should apply selectedRuntime', () => {
		const state = createMockState({
			runtime: {
				runtimeSettings: [
					{ runtime: 'AudioWorkletRuntime', sampleRate: 44100 },
					{ runtime: 'WebWorkerLogicRuntime', sampleRate: 50 },
				],
				selectedRuntime: 0,
			},
		});
		const store = createStateManager(state);
		applyConfigToState(store, {
			runtimeSettings: [
				{ runtime: 'AudioWorkletRuntime', sampleRate: 44100 },
				{ runtime: 'WebWorkerLogicRuntime', sampleRate: 50 },
			],
			selectedRuntime: 1,
		});
		expect(state.runtime.selectedRuntime).toBe(1);
	});

	it('should apply runtimeSettings', () => {
		const state = createMockState();
		const store = createStateManager(state);
		const runtimeSettings = [
			{ runtime: 'AudioWorkletRuntime' as const, sampleRate: 44100 },
			{ runtime: 'WebWorkerLogicRuntime' as const, sampleRate: 50 },
		];
		applyConfigToState(store, { runtimeSettings });
		expect(state.runtime.runtimeSettings).toEqual(runtimeSettings);
	});

	it('should not apply invalid runtimeSettings', () => {
		const state = createMockState();
		const store = createStateManager(state);
		const originalSettings = [...state.runtime.runtimeSettings];
		const originalSelectedRuntime = state.runtime.selectedRuntime;
		const config = { runtimeSettings: [{ invalid: true }] } as unknown as ConfigObject;
		applyConfigToState(store, config);
		// When all runtime settings are invalid, the runtime state should remain unchanged to preserve existing settings
		expect(state.runtime.runtimeSettings).toEqual(originalSettings);
		expect(state.runtime.selectedRuntime).toBe(originalSelectedRuntime);
	});

	it('should not apply runtimeSettings with invalid runtime type', () => {
		const state = createMockState();
		const store = createStateManager(state);
		const originalSettings = [...state.runtime.runtimeSettings];
		const originalSelectedRuntime = state.runtime.selectedRuntime;
		const config = { runtimeSettings: [{ runtime: 'InvalidRuntime', sampleRate: 44100 }] } as unknown as ConfigObject;
		applyConfigToState(store, config);
		// When all runtime settings are invalid, the runtime state should remain unchanged to preserve existing settings
		expect(state.runtime.runtimeSettings).toEqual(originalSettings);
		expect(state.runtime.selectedRuntime).toBe(originalSelectedRuntime);
	});

	it('should apply disableCompilation flag', () => {
		const state = createMockState();
		const store = createStateManager(state);
		expect(state.compiler.disableCompilation).toBe(false);
		applyConfigToState(store, { disableCompilation: true });
		expect(state.compiler.disableCompilation).toBe(true);
	});

	it('should not change disableCompilation when not in config', () => {
		const state = createMockState();
		const store = createStateManager(state);
		state.compiler.disableCompilation = true;
		applyConfigToState(store, { memorySizeBytes: 65536 });
		expect(state.compiler.disableCompilation).toBe(true);
	});
});
