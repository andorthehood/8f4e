import { describe, it, expect } from 'vitest';

import { applyConfigToState } from './applyConfigToState';

import { createMockState } from '../../pureHelpers/testingUtils/testUtils';

import type { ConfigObject } from './applyConfigToState';

describe('applyConfigToState', () => {
	it('should apply title', () => {
		const state = createMockState();
		applyConfigToState(state, { title: 'Test Title' });
		expect(state.projectInfo.title).toBe('Test Title');
	});

	it('should apply author', () => {
		const state = createMockState();
		applyConfigToState(state, { author: 'Test Author' });
		expect(state.projectInfo.author).toBe('Test Author');
	});

	it('should apply description', () => {
		const state = createMockState();
		applyConfigToState(state, { description: 'Test Description' });
		expect(state.projectInfo.description).toBe('Test Description');
	});

	it('should apply memorySizeBytes', () => {
		const state = createMockState();
		applyConfigToState(state, { memorySizeBytes: 65536 });
		expect(state.compiler.compilerOptions.memorySizeBytes).toBe(65536);
	});

	it('should apply selectedRuntime', () => {
		const state = createMockState();
		applyConfigToState(state, { selectedRuntime: 1 });
		expect(state.runtime.selectedRuntime).toBe(1);
	});

	it('should apply runtimeSettings', () => {
		const state = createMockState();
		const runtimeSettings = [
			{ runtime: 'AudioWorkletRuntime' as const, sampleRate: 44100 },
			{ runtime: 'WebWorkerLogicRuntime' as const, sampleRate: 50 },
		];
		applyConfigToState(state, { runtimeSettings });
		expect(state.runtime.runtimeSettings).toEqual(runtimeSettings);
	});

	it('should not apply invalid runtimeSettings', () => {
		const state = createMockState();
		const originalSettings = [...state.runtime.runtimeSettings];
		const config = { runtimeSettings: [{ invalid: true }] } as unknown as ConfigObject;
		applyConfigToState(state, config);
		expect(state.runtime.runtimeSettings).toEqual(originalSettings);
	});

	it('should not apply runtimeSettings with invalid runtime type', () => {
		const state = createMockState();
		const originalSettings = [...state.runtime.runtimeSettings];
		const config = { runtimeSettings: [{ runtime: 'InvalidRuntime', sampleRate: 44100 }] } as unknown as ConfigObject;
		applyConfigToState(state, config);
		expect(state.runtime.runtimeSettings).toEqual(originalSettings);
	});

	it('should handle partial config', () => {
		const state = createMockState();
		state.projectInfo.title = 'Original';
		state.projectInfo.author = 'Original Author';
		applyConfigToState(state, { title: 'New Title' });
		expect(state.projectInfo.title).toBe('New Title');
		expect(state.projectInfo.author).toBe('Original Author');
	});
});
