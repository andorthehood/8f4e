import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import groupStickyToggler from './effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('groupStickyToggler', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	it('should add sticky to @group directive in all group blocks when makeSticky is true', () => {
		const block1 = createMockCodeBlock({
			code: ['module test1', '; @group audio-chain', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		const block2 = createMockCodeBlock({
			code: ['module test2', '; @group audio-chain', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		const block3 = createMockCodeBlock({
			code: ['module test3', '; @group other-group', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'other-group',
		});
		mockState.graphicHelper.codeBlocks = [block1, block2, block3];
		mockState.featureFlags.editing = true;

		groupStickyToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleGroupSticky');
		expect(toggleCall).toBeDefined();

		const toggleCallback = toggleCall![1];
		toggleCallback({ codeBlock: block1, makeSticky: true });

		// Both blocks in the group should have sticky added
		expect(block1.code).toEqual(['module test1', '; @group audio-chain sticky', '', 'moduleEnd']);
		expect(block2.code).toEqual(['module test2', '; @group audio-chain sticky', '', 'moduleEnd']);
		// Block in different group should be unchanged
		expect(block3.code).toEqual(['module test3', '; @group other-group', '', 'moduleEnd']);
	});

	it('should remove sticky from @group directive in all group blocks when makeSticky is false', () => {
		const block1 = createMockCodeBlock({
			code: ['module test1', '; @group audio-chain sticky', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
			groupSticky: true,
		});
		const block2 = createMockCodeBlock({
			code: ['module test2', '; @group audio-chain sticky', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
			groupSticky: true,
		});
		mockState.graphicHelper.codeBlocks = [block1, block2];
		mockState.featureFlags.editing = true;

		groupStickyToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleGroupSticky');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock: block1, makeSticky: false });

		// Both blocks should have sticky removed
		expect(block1.code).toEqual(['module test1', '; @group audio-chain', '', 'moduleEnd']);
		expect(block2.code).toEqual(['module test2', '; @group audio-chain', '', 'moduleEnd']);
	});

	it('should normalize sticky state when some blocks are sticky and others are not', () => {
		const block1 = createMockCodeBlock({
			code: ['module test1', '; @group audio-chain sticky', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
			groupSticky: true,
		});
		const block2 = createMockCodeBlock({
			code: ['module test2', '; @group audio-chain', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		mockState.graphicHelper.codeBlocks = [block1, block2];
		mockState.featureFlags.editing = true;

		groupStickyToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleGroupSticky');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock: block1, makeSticky: true });

		// Block 1 should keep sticky, block 2 should get sticky
		expect(block1.code).toEqual(['module test1', '; @group audio-chain sticky', '', 'moduleEnd']);
		expect(block2.code).toEqual(['module test2', '; @group audio-chain sticky', '', 'moduleEnd']);
	});

	it('should handle @group directive with whitespace variations', () => {
		const block1 = createMockCodeBlock({
			code: ['module test1', ';   @group   audio-chain', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		mockState.graphicHelper.codeBlocks = [block1];
		mockState.featureFlags.editing = true;

		groupStickyToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleGroupSticky');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock: block1, makeSticky: true });

		// Should add sticky despite whitespace variations
		expect(block1.code).toEqual(['module test1', '; @group audio-chain sticky', '', 'moduleEnd']);
	});

	it('should work with different block types', () => {
		const moduleBlock = createMockCodeBlock({
			code: ['module test1', '; @group audio-chain', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		const functionBlock = createMockCodeBlock({
			code: ['function test2', '; @group audio-chain', '', 'functionEnd'],
			blockType: 'function',
			groupName: 'audio-chain',
		});
		mockState.graphicHelper.codeBlocks = [moduleBlock, functionBlock];
		mockState.featureFlags.editing = true;

		groupStickyToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleGroupSticky');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock: moduleBlock, makeSticky: true });

		// Both blocks should be affected regardless of type
		expect(moduleBlock.code).toEqual(['module test1', '; @group audio-chain sticky', '', 'moduleEnd']);
		expect(functionBlock.code).toEqual(['function test2', '; @group audio-chain sticky', '', 'functionEnd']);
	});

	it('should not toggle when editing is disabled', () => {
		const block1 = createMockCodeBlock({
			code: ['module test1', '; @group audio-chain', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		mockState.graphicHelper.codeBlocks = [block1];
		mockState.featureFlags.editing = false;

		groupStickyToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleGroupSticky');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock: block1, makeSticky: true });

		expect(block1.code).toEqual(['module test1', '; @group audio-chain', '', 'moduleEnd']);
	});

	it('should not toggle when code block has no group name', () => {
		const block1 = createMockCodeBlock({
			code: ['module test1', '', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [block1];
		mockState.featureFlags.editing = true;

		groupStickyToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleGroupSticky');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock: block1, makeSticky: true });

		expect(block1.code).toEqual(['module test1', '', 'moduleEnd']);
	});

	it('should update lastUpdated for all affected blocks', () => {
		const block1 = createMockCodeBlock({
			code: ['module test1', '; @group audio-chain', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
			lastUpdated: 1000,
		});
		const block2 = createMockCodeBlock({
			code: ['module test2', '; @group audio-chain', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
			lastUpdated: 1000,
		});
		mockState.graphicHelper.codeBlocks = [block1, block2];
		mockState.featureFlags.editing = true;

		groupStickyToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleGroupSticky');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock: block1, makeSticky: true });

		expect(block1.lastUpdated).toBeGreaterThan(1000);
		expect(block2.lastUpdated).toBeGreaterThan(1000);
	});

	it('should trigger store update for each affected block', () => {
		const block1 = createMockCodeBlock({
			code: ['module test1', '; @group audio-chain', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		const block2 = createMockCodeBlock({
			code: ['module test2', '; @group audio-chain', '', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		mockState.graphicHelper.codeBlocks = [block1, block2];
		mockState.featureFlags.editing = true;

		groupStickyToggler(store, mockEvents);

		const setSpy = vi.spyOn(store, 'set');

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleGroupSticky');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock: block1, makeSticky: true });

		// Should be called twice - once for each block
		expect(setSpy).toHaveBeenCalledTimes(2);
		expect(setSpy).toHaveBeenCalledWith('graphicHelper.selectedCodeBlockForProgrammaticEdit', block1);
		expect(setSpy).toHaveBeenCalledWith('graphicHelper.selectedCodeBlockForProgrammaticEdit', block2);
	});
});
