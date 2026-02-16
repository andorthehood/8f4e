import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import groupRemover from './effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('groupRemover', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	it('should remove ; @group directive when present', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		groupRemover(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		expect(removeCall).toBeDefined();

		const removeCallback = removeCall![1];
		removeCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should remove all ; @group directive lines when multiple exist', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @group firstGroup', '', '; @group secondGroup', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		groupRemover(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		const removeCallback = removeCall![1];

		removeCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should handle ; @group with trailing whitespace', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @group myGroup  ', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		groupRemover(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		const removeCallback = removeCall![1];

		removeCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should handle indented ; @group directive', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '  ; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		groupRemover(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		const removeCallback = removeCall![1];

		removeCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should handle ; @group with extra whitespace', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', ';   @group   myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		groupRemover(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		const removeCallback = removeCall![1];

		removeCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should not remove other directives', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @group myGroup', '; @favorite', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		groupRemover(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		const removeCallback = removeCall![1];

		removeCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '; @favorite', '', 'moduleEnd']);
	});

	it('should be no-op when no group directive is present', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '', 'moduleEnd'],
			blockType: 'module',
		});
		const originalCode = [...codeBlock.code];
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		groupRemover(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		const removeCallback = removeCall![1];

		removeCallback({ codeBlock });

		expect(codeBlock.code).toEqual(originalCode);
	});

	it('should update lastUpdated for cache invalidation', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
			lastUpdated: 1000,
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		groupRemover(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		const removeCallback = removeCall![1];

		removeCallback({ codeBlock });

		expect(codeBlock.lastUpdated).toBeGreaterThan(1000);
	});

	it('should trigger store update', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		groupRemover(store, mockEvents);

		const setSpy = vi.spyOn(store, 'set');

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		const removeCallback = removeCall![1];

		removeCallback({ codeBlock });

		expect(setSpy).toHaveBeenCalledWith('graphicHelper.selectedCodeBlockForProgrammaticEdit', codeBlock);
	});

	it('should not remove when editing is disabled', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = false;

		groupRemover(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		const removeCallback = removeCall![1];

		removeCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '; @group myGroup', '', 'moduleEnd']);
	});

	it('should work with different block types', () => {
		const functionBlock = createMockCodeBlock({
			code: ['function test', '; @group funcGroup', 'functionEnd'],
			blockType: 'function',
		});
		mockState.graphicHelper.codeBlocks = [functionBlock];
		mockState.featureFlags.editing = true;

		groupRemover(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		const removeCallback = removeCall![1];

		removeCallback({ codeBlock: functionBlock });

		expect(functionBlock.code).toEqual(['function test', 'functionEnd']);
	});

	it('should handle group names with hyphens and underscores', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @group audio-chain_1', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		groupRemover(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		const removeCallback = removeCall![1];

		removeCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should handle group directive with additional text', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module test', '; @group myGroup extra text here', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		groupRemover(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const removeCall = onCalls.find(call => call[0] === 'removeFromGroupDirective');
		const removeCallback = removeCall![1];

		removeCallback({ codeBlock });

		expect(codeBlock.code).toEqual(['module test', '', 'moduleEnd']);
	});
});
