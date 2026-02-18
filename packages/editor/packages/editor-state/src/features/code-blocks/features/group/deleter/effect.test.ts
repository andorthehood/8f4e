import { describe, it, expect, beforeEach, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import groupDeleter from './effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('groupDeleter', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	it('should delete all blocks with matching group name', () => {
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

		groupDeleter(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const deleteCall = onCalls.find(call => call[0] === 'deleteGroup');
		expect(deleteCall).toBeDefined();

		const deleteCallback = deleteCall![1];
		deleteCallback({ codeBlock: codeBlock1 });

		const state = store.getState();
		expect(state.graphicHelper.codeBlocks).toEqual([]);
	});

	it('should not delete blocks with different group name', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		const codeBlock2 = createMockCodeBlock({
			code: ['module test2', '; @group otherGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		const codeBlock3 = createMockCodeBlock({
			code: ['module test3', '', 'moduleEnd'],
			blockType: 'module',
		});

		codeBlock1.groupName = 'myGroup';
		codeBlock2.groupName = 'otherGroup';
		codeBlock3.groupName = undefined;

		mockState.graphicHelper.codeBlocks = [codeBlock1, codeBlock2, codeBlock3];
		mockState.featureFlags.editing = true;

		groupDeleter(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const deleteCall = onCalls.find(call => call[0] === 'deleteGroup');
		const deleteCallback = deleteCall![1];

		deleteCallback({ codeBlock: codeBlock1 });

		const state = store.getState();
		expect(state.graphicHelper.codeBlocks).toEqual([codeBlock2, codeBlock3]);
		expect(state.graphicHelper.codeBlocks).toHaveLength(2);
	});

	it('should work with mixed block types in a group', () => {
		const moduleBlock = createMockCodeBlock({
			code: ['module test1', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		const functionBlock = createMockCodeBlock({
			code: ['function test2', '; @group myGroup', 'functionEnd'],
			blockType: 'function',
		});
		const envBlock = createMockCodeBlock({
			code: ['env test3', '; @group myGroup', 'envEnd'],
			blockType: 'env',
		});

		moduleBlock.groupName = 'myGroup';
		functionBlock.groupName = 'myGroup';
		envBlock.groupName = 'myGroup';

		mockState.graphicHelper.codeBlocks = [moduleBlock, functionBlock, envBlock];
		mockState.featureFlags.editing = true;

		groupDeleter(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const deleteCall = onCalls.find(call => call[0] === 'deleteGroup');
		const deleteCallback = deleteCall![1];

		deleteCallback({ codeBlock: moduleBlock });

		const state = store.getState();
		expect(state.graphicHelper.codeBlocks).toEqual([]);
	});

	it('should clear selectedCodeBlock if it is deleted', () => {
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
		mockState.graphicHelper.selectedCodeBlock = codeBlock1;
		mockState.featureFlags.editing = true;

		groupDeleter(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const deleteCall = onCalls.find(call => call[0] === 'deleteGroup');
		const deleteCallback = deleteCall![1];

		deleteCallback({ codeBlock: codeBlock1 });

		const state = store.getState();
		expect(state.graphicHelper.selectedCodeBlock).toBeUndefined();
	});

	it('should clear draggedCodeBlock if it is deleted', () => {
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
		mockState.graphicHelper.draggedCodeBlock = codeBlock2;
		mockState.featureFlags.editing = true;

		groupDeleter(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const deleteCall = onCalls.find(call => call[0] === 'deleteGroup');
		const deleteCallback = deleteCall![1];

		deleteCallback({ codeBlock: codeBlock1 });

		const state = store.getState();
		expect(state.graphicHelper.draggedCodeBlock).toBeUndefined();
	});

	it('should clear selectedCodeBlockForProgrammaticEdit if it is deleted', () => {
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
		mockState.graphicHelper.selectedCodeBlockForProgrammaticEdit = codeBlock1;
		mockState.featureFlags.editing = true;

		groupDeleter(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const deleteCall = onCalls.find(call => call[0] === 'deleteGroup');
		const deleteCallback = deleteCall![1];

		deleteCallback({ codeBlock: codeBlock1 });

		const state = store.getState();
		expect(state.graphicHelper.selectedCodeBlockForProgrammaticEdit).toBeUndefined();
	});

	it('should do nothing when codeBlock has no groupName', () => {
		const codeBlock1 = createMockCodeBlock({
			code: ['module test1', '', 'moduleEnd'],
			blockType: 'module',
		});
		const codeBlock2 = createMockCodeBlock({
			code: ['module test2', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});

		codeBlock1.groupName = undefined;
		codeBlock2.groupName = 'myGroup';

		mockState.graphicHelper.codeBlocks = [codeBlock1, codeBlock2];
		mockState.featureFlags.editing = true;

		groupDeleter(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const deleteCall = onCalls.find(call => call[0] === 'deleteGroup');
		const deleteCallback = deleteCall![1];

		deleteCallback({ codeBlock: codeBlock1 });

		const state = store.getState();
		expect(state.graphicHelper.codeBlocks).toEqual([codeBlock1, codeBlock2]);
	});

	it('should do nothing when editing is disabled', () => {
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
		mockState.featureFlags.editing = false; // Editing disabled

		groupDeleter(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const deleteCall = onCalls.find(call => call[0] === 'deleteGroup');
		const deleteCallback = deleteCall![1];

		deleteCallback({ codeBlock: codeBlock1 });

		const state = store.getState();
		expect(state.graphicHelper.codeBlocks).toEqual([codeBlock1, codeBlock2]);
	});

	it('should preserve non-group blocks when deleting a group', () => {
		const groupBlock1 = createMockCodeBlock({
			code: ['module test1', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		const groupBlock2 = createMockCodeBlock({
			code: ['module test2', '; @group myGroup', '', 'moduleEnd'],
			blockType: 'module',
		});
		const standaloneBlock = createMockCodeBlock({
			code: ['module standalone', '', 'moduleEnd'],
			blockType: 'module',
		});
		const otherGroupBlock = createMockCodeBlock({
			code: ['module test4', '; @group otherGroup', '', 'moduleEnd'],
			blockType: 'module',
		});

		groupBlock1.groupName = 'myGroup';
		groupBlock2.groupName = 'myGroup';
		standaloneBlock.groupName = undefined;
		otherGroupBlock.groupName = 'otherGroup';

		mockState.graphicHelper.codeBlocks = [groupBlock1, groupBlock2, standaloneBlock, otherGroupBlock];
		mockState.featureFlags.editing = true;

		groupDeleter(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const deleteCall = onCalls.find(call => call[0] === 'deleteGroup');
		const deleteCallback = deleteCall![1];

		deleteCallback({ codeBlock: groupBlock1 });

		const state = store.getState();
		expect(state.graphicHelper.codeBlocks).toEqual([standaloneBlock, otherGroupBlock]);
		expect(state.graphicHelper.codeBlocks).toHaveLength(2);
	});

	it('should handle deleting a large group efficiently', () => {
		const groupBlocks = Array.from({ length: 100 }, (_, i) =>
			createMockCodeBlock({
				code: [`module test${i}`, '; @group largeGroup', '', 'moduleEnd'],
				blockType: 'module',
			})
		);

		groupBlocks.forEach(block => {
			block.groupName = 'largeGroup';
		});

		const otherBlock = createMockCodeBlock({
			code: ['module other', '', 'moduleEnd'],
			blockType: 'module',
		});

		mockState.graphicHelper.codeBlocks = [...groupBlocks, otherBlock];
		mockState.featureFlags.editing = true;

		groupDeleter(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const deleteCall = onCalls.find(call => call[0] === 'deleteGroup');
		const deleteCallback = deleteCall![1];

		deleteCallback({ codeBlock: groupBlocks[0] });

		const state = store.getState();
		expect(state.graphicHelper.codeBlocks).toEqual([otherBlock]);
		expect(state.graphicHelper.codeBlocks).toHaveLength(1);
	});
});
