import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import clearDebugProbes from './effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('clearDebugProbes', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	it('should remove single @debug directive', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @debug x', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		clearDebugProbes(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const clearCall = onCalls.find(call => call[0] === 'clearDebugProbes');
		expect(clearCall).toBeDefined();

		const clearCallback = clearCall![1];
		clearCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should remove multiple @debug directives', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @debug x', '', '; @debug y', '; @debug z', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		clearDebugProbes(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const clearCall = onCalls.find(call => call[0] === 'clearDebugProbes');
		const clearCallback = clearCall![1];

		clearCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should be no-op when there are no @debug directives', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		clearDebugProbes(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const clearCall = onCalls.find(call => call[0] === 'clearDebugProbes');
		const clearCallback = clearCall![1];

		clearCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should preserve other directive lines', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @group mygroup', '; @debug x', '; @favorite', '; @debug y', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		clearDebugProbes(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const clearCall = onCalls.find(call => call[0] === 'clearDebugProbes');
		const clearCallback = clearCall![1];

		clearCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '; @group mygroup', '; @favorite', 'moduleEnd']);
	});

	it('should handle @debug directives with trailing whitespace', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @debug x  ', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		clearDebugProbes(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const clearCall = onCalls.find(call => call[0] === 'clearDebugProbes');
		const clearCallback = clearCall![1];

		clearCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should handle indented @debug directives', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '  ; @debug x', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		clearDebugProbes(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const clearCall = onCalls.find(call => call[0] === 'clearDebugProbes');
		const clearCallback = clearCall![1];

		clearCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should update lastUpdated for cache invalidation', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @debug x', 'moduleEnd'],
			blockType: 'module',
			lastUpdated: 1000,
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		clearDebugProbes(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const clearCall = onCalls.find(call => call[0] === 'clearDebugProbes');
		const clearCallback = clearCall![1];

		clearCallback({ codeBlock });

		expect(codeBlock.lastUpdated).toBeGreaterThan(1000);
	});

	it('should trigger store update', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @debug x', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		clearDebugProbes(store, mockEvents);

		const setSpy = vi.spyOn(store, 'set');

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const clearCall = onCalls.find(call => call[0] === 'clearDebugProbes');
		const clearCallback = clearCall![1];

		clearCallback({ codeBlock });

		expect(setSpy).toHaveBeenCalledWith('graphicHelper.selectedCodeBlockForProgrammaticEdit', codeBlock);
	});

	it('should not clear when editing is disabled', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @debug x', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = false;

		clearDebugProbes(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const clearCall = onCalls.find(call => call[0] === 'clearDebugProbes');
		const clearCallback = clearCall![1];

		clearCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '; @debug x', 'moduleEnd']);
	});

	it('should preserve incomplete @debug directives without variable name', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @debug', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		clearDebugProbes(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const clearCall = onCalls.find(call => call[0] === 'clearDebugProbes');
		const clearCallback = clearCall![1];

		clearCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '; @debug', 'moduleEnd']);
	});
});
