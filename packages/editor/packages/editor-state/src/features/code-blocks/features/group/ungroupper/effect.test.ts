import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import groupUngroupper from './effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('groupUngroupper', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	it('should remove ; @group directive from all blocks with matching group name', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		const codeBlock2 = createMockCodeBlock({
			code: ['module test2', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		const codeBlock3 = createMockCodeBlock({
			code: ['function test3', '; @group myGroup', 'functionEnd'],
			blockType: 'function',
		});

		// Set groupName on blocks (normally done by graphicHelper)
		codeBlock1.groupName = 'myGroup';
		codeBlock2.groupName = 'myGroup';
		codeBlock3.groupName = 'myGroup';

		mockState.graphicHelper.codeBlocks = [codeBlock1, codeBlock2, codeBlock3];
		mockState.featureFlags.editing = true;

		groupUngroupper(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const ungroupCall = onCalls.find(call => call[0] === 'ungroupByName');
		expect(ungroupCall).toBeDefined();

		const ungroupCallback = ungroupCall![1];
		ungroupCallback({ codeBlock: codeBlock1 });

		expect(codeBlock1.code).toEqual(['module test1', '', 'moduleEnd']);
		expect(codeBlock2.code).toEqual(['module test2', '', 'moduleEnd']);
		expect(codeBlock3.code).toEqual(['function test3', 'functionEnd']);
	});

	it('should not remove ; @group directive from blocks with different group name', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		const codeBlock2 = createMockCodeBlock({
			code: ['module test2', '; @group otherGroup', '', 'moduleEnd'],
			blockType: 'module',
		});

		codeBlock1.groupName = 'myGroup';
		codeBlock2.groupName = 'otherGroup';

		mockState.graphicHelper.codeBlocks = [codeBlock1, codeBlock2];
		mockState.featureFlags.editing = true;

		groupUngroupper(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const ungroupCall = onCalls.find(call => call[0] === 'ungroupByName');
		const ungroupCallback = ungroupCall![1];

		ungroupCallback({ codeBlock: codeBlock1 });

		expect(codeBlock1.code).toEqual(['module test1', '', 'moduleEnd']);
		expect(codeBlock2.code).toEqual(['module test2', '; @group otherGroup', '', 'moduleEnd']);
	});

	it('should not remove other directives', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '; @group myGroup', '; @favorite', '', 'moduleEnd'],
			blockType: 'module',
		});
		const codeBlock2 = createMockCodeBlock({
			code: ['module test2', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});

		codeBlock1.groupName = 'myGroup';
		codeBlock2.groupName = 'myGroup';

		mockState.graphicHelper.codeBlocks = [codeBlock1, codeBlock2];
		mockState.featureFlags.editing = true;

		groupUngroupper(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const ungroupCall = onCalls.find(call => call[0] === 'ungroupByName');
		const ungroupCallback = ungroupCall![1];

		ungroupCallback({ codeBlock: codeBlock1 });

		expect(codeBlock1.code).toEqual(['module test1', '; @favorite', '', 'moduleEnd']);
		expect(codeBlock2.code).toEqual(['module test2', '', 'moduleEnd']);
	});

	it('should handle blocks with multiple ; @group directive lines', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '; @group myGroup', '', '; @group myGroup', 'moduleEnd'],
			blockType: 'module',
		});

		codeBlock1.groupName = 'myGroup';

		mockState.graphicHelper.codeBlocks = [codeBlock1];
		mockState.featureFlags.editing = true;

		groupUngroupper(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const ungroupCall = onCalls.find(call => call[0] === 'ungroupByName');
		const ungroupCallback = ungroupCall![1];

		ungroupCallback({ codeBlock: codeBlock1 });

		expect(codeBlock1.code).toEqual(['module test1', '', 'moduleEnd']);
	});

	it('should update lastUpdated for all affected blocks', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
			lastUpdated: 1000,
		});
		const codeBlock2 = createMockCodeBlock({
			code: ['module test2', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
			lastUpdated: 1000,
		});

		codeBlock1.groupName = 'myGroup';
		codeBlock2.groupName = 'myGroup';

		mockState.graphicHelper.codeBlocks = [codeBlock1, codeBlock2];
		mockState.featureFlags.editing = true;

		groupUngroupper(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const ungroupCall = onCalls.find(call => call[0] === 'ungroupByName');
		const ungroupCallback = ungroupCall![1];

		ungroupCallback({ codeBlock: codeBlock1 });

		expect(codeBlock1.lastUpdated).toBeGreaterThan(1000);
		expect(codeBlock2.lastUpdated).toBeGreaterThan(1000);
	});

	it('should trigger store update', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});

		codeBlock1.groupName = 'myGroup';

		mockState.graphicHelper.codeBlocks = [codeBlock1];
		mockState.featureFlags.editing = true;

		groupUngroupper(store, mockEvents);

		const setSpy = vi.spyOn(store, 'set');

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const ungroupCall = onCalls.find(call => call[0] === 'ungroupByName');
		const ungroupCallback = ungroupCall![1];

		ungroupCallback({ codeBlock: codeBlock1 });

		expect(setSpy).toHaveBeenCalledWith('graphicHelper.codeBlocks', mockState.graphicHelper.codeBlocks);
	});

	it('should be no-op when selected block has no group name', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '', 'moduleEnd'],
			blockType: 'module',
		});

		mockState.graphicHelper.codeBlocks = [codeBlock1];
		mockState.featureFlags.editing = true;

		groupUngroupper(store, mockEvents);

		const setSpy = vi.spyOn(store, 'set');

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const ungroupCall = onCalls.find(call => call[0] === 'ungroupByName');
		const ungroupCallback = ungroupCall![1];

		ungroupCallback({ codeBlock: codeBlock1 });

		expect(setSpy).not.toHaveBeenCalled();
	});

	it('should be no-op when no matching blocks found', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '', 'moduleEnd'],
			blockType: 'module',
		});

		codeBlock1.groupName = 'nonexistentGroup';

		mockState.graphicHelper.codeBlocks = [codeBlock1];
		mockState.featureFlags.editing = true;

		groupUngroupper(store, mockEvents);

		const setSpy = vi.spyOn(store, 'set');

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const ungroupCall = onCalls.find(call => call[0] === 'ungroupByName');
		const ungroupCallback = ungroupCall![1];

		ungroupCallback({ codeBlock: codeBlock1 });

		// Store update should still happen, but no code changes
		expect(setSpy).toHaveBeenCalledWith('graphicHelper.codeBlocks', mockState.graphicHelper.codeBlocks);
		expect(codeBlock1.code).toEqual(['module test1', '', 'moduleEnd']);
	});

	it('should not ungroup when editing is disabled', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		const codeBlock2 = createMockCodeBlock({
			code: ['module test2', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});

		codeBlock1.groupName = 'myGroup';
		codeBlock2.groupName = 'myGroup';

		mockState.graphicHelper.codeBlocks = [codeBlock1, codeBlock2];
		mockState.featureFlags.editing = false;

		groupUngroupper(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const ungroupCall = onCalls.find(call => call[0] === 'ungroupByName');
		const ungroupCallback = ungroupCall![1];

		ungroupCallback({ codeBlock: codeBlock1 });

		expect(codeBlock1.code).toEqual(['module test1', '; @group myGroup', '', 'moduleEnd']);
		expect(codeBlock2.code).toEqual(['module test2', '; @group myGroup', '', 'moduleEnd']);
	});

	it('should handle blocks with indented and whitespace variations', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '  ; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		const codeBlock2 = createMockCodeBlock({
			code: ['module test2', ';   @group   myGroup  ', '', 'moduleEnd'],
			blockType: 'module',
		});

		codeBlock1.groupName = 'myGroup';
		codeBlock2.groupName = 'myGroup';

		mockState.graphicHelper.codeBlocks = [codeBlock1, codeBlock2];
		mockState.featureFlags.editing = true;

		groupUngroupper(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const ungroupCall = onCalls.find(call => call[0] === 'ungroupByName');
		const ungroupCallback = ungroupCall![1];

		ungroupCallback({ codeBlock: codeBlock1 });

		expect(codeBlock1.code).toEqual(['module test1', '', 'moduleEnd']);
		expect(codeBlock2.code).toEqual(['module test2', '', 'moduleEnd']);
	});

	it('should handle group names with hyphens and underscores', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '; @group audio-chain_1', '', 'moduleEnd'],
			blockType: 'module',
		});
		const codeBlock2 = createMockCodeBlock({
			code: ['module test2', '; @group audio-chain_1', '', 'moduleEnd'],
			blockType: 'module',
		});

		codeBlock1.groupName = 'audio-chain_1';
		codeBlock2.groupName = 'audio-chain_1';

		mockState.graphicHelper.codeBlocks = [codeBlock1, codeBlock2];
		mockState.featureFlags.editing = true;

		groupUngroupper(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const ungroupCall = onCalls.find(call => call[0] === 'ungroupByName');
		const ungroupCallback = ungroupCall![1];

		ungroupCallback({ codeBlock: codeBlock1 });

		expect(codeBlock1.code).toEqual(['module test1', '', 'moduleEnd']);
		expect(codeBlock2.code).toEqual(['module test2', '', 'moduleEnd']);
	});

	it('should only match exact group names', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		const codeBlock2 = createMockCodeBlock({
			code: ['module test2', '; @group myGroup2', '', 'moduleEnd'],
			blockType: 'module',
		});
		const codeBlock3 = createMockCodeBlock({
			code: ['module test3', '; @group myGroupExtended', '', 'moduleEnd'],
			blockType: 'module',
		});

		codeBlock1.groupName = 'myGroup';
		codeBlock2.groupName = 'myGroup2';
		codeBlock3.groupName = 'myGroupExtended';

		mockState.graphicHelper.codeBlocks = [codeBlock1, codeBlock2, codeBlock3];
		mockState.featureFlags.editing = true;

		groupUngroupper(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const ungroupCall = onCalls.find(call => call[0] === 'ungroupByName');
		const ungroupCallback = ungroupCall![1];

		ungroupCallback({ codeBlock: codeBlock1 });

		expect(codeBlock1.code).toEqual(['module test1', '', 'moduleEnd']);
		expect(codeBlock2.code).toEqual(['module test2', '; @group myGroup2', '', 'moduleEnd']);
		expect(codeBlock3.code).toEqual(['module test3', '; @group myGroupExtended', '', 'moduleEnd']);
	});
});
