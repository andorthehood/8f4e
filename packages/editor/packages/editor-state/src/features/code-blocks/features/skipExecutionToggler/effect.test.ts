import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import skipExecutionToggler from './effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('skipExecutionToggler', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	it('should insert #skipExecution directive when absent', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		skipExecutionToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleModuleSkipExecutionDirective');
		expect(toggleCall).toBeDefined();

		const toggleCallback = toggleCall![1];
		toggleCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '#skipExecution', '', 'moduleEnd']);
	});

	it('should remove #skipExecution directive when present', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '#skipExecution', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		skipExecutionToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleModuleSkipExecutionDirective');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should remove all #skipExecution directive lines when present', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '#skipExecution', '', '#skipExecution', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		skipExecutionToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleModuleSkipExecutionDirective');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should handle #skipExecution with trailing whitespace', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '#skipExecution  ', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		skipExecutionToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleModuleSkipExecutionDirective');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should handle indented #skipExecution directive', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '  #skipExecution', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		skipExecutionToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleModuleSkipExecutionDirective');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should update lastUpdated for cache invalidation', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '', 'moduleEnd'],
			blockType: 'module',
			lastUpdated: 1000,
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		skipExecutionToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleModuleSkipExecutionDirective');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(codeBlock.lastUpdated).toBeGreaterThan(1000);
	});

	it('should trigger store update', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		skipExecutionToggler(store, mockEvents);

		const setSpy = vi.spyOn(store, 'set');

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleModuleSkipExecutionDirective');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(setSpy).toHaveBeenCalledWith('graphicHelper.selectedCodeBlockForProgrammaticEdit', codeBlock);
	});

	it('should not toggle when editing is disabled', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = false;

		skipExecutionToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleModuleSkipExecutionDirective');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});
});
