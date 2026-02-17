import { describe, it, expect, beforeEach, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import groupNonstickToggler from './effect';

import { createCodeBlockGraphicData } from '../../../utils/createCodeBlockGraphicData';

import type { State } from '~/types';

import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('groupNonstickToggler', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = {
			featureFlags: {
				editing: true,
			},
			graphicHelper: {
				codeBlocks: [],
				selectedCodeBlockForProgrammaticEdit: undefined,
			},
		} as State;

		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();

		mockState.featureFlags.editing = true;

		groupNonstickToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		expect(onCalls.length).toBeGreaterThan(0);
		expect(onCalls[0][0]).toBe('toggleGroupNonstick');
	});

	it('should add nonstick keyword to all group members', () => {
		const block1 = createCodeBlockGraphicData({
			code: ['module test1', '; @group audio-chain', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		const block2 = createCodeBlockGraphicData({
			code: ['module test2', '; @group audio-chain', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		mockState.graphicHelper.codeBlocks = [block1, block2];
		mockState.featureFlags.editing = true;

		groupNonstickToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleHandler = onCalls[0][1];

		toggleHandler({ codeBlock: block1, makeNonstick: true });

		expect(block1.code[1]).toBe('; @group audio-chain nonstick');
		expect(block2.code[1]).toBe('; @group audio-chain nonstick');
	});

	it('should remove nonstick keyword from all group members', () => {
		const block1 = createCodeBlockGraphicData({
			code: ['module test1', '; @group audio-chain nonstick', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
			groupNonstick: true,
		});
		const block2 = createCodeBlockGraphicData({
			code: ['module test2', '; @group audio-chain nonstick', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
			groupNonstick: true,
		});
		mockState.graphicHelper.codeBlocks = [block1, block2];
		mockState.featureFlags.editing = true;

		groupNonstickToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleHandler = onCalls[0][1];

		toggleHandler({ codeBlock: block1, makeNonstick: false });

		expect(block1.code[1]).toBe('; @group audio-chain');
		expect(block2.code[1]).toBe('; @group audio-chain');
	});

	it('should replace sticky with nonstick when making group nonstick', () => {
		const block1 = createCodeBlockGraphicData({
			code: ['module test1', '; @group audio-chain sticky', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
			groupSticky: true,
		});
		const block2 = createCodeBlockGraphicData({
			code: ['module test2', '; @group audio-chain sticky', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
			groupSticky: true,
		});
		mockState.graphicHelper.codeBlocks = [block1, block2];
		mockState.featureFlags.editing = true;

		groupNonstickToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleHandler = onCalls[0][1];

		toggleHandler({ codeBlock: block1, makeNonstick: true });

		expect(block1.code[1]).toBe('; @group audio-chain nonstick');
		expect(block2.code[1]).toBe('; @group audio-chain nonstick');
	});

	it('should do nothing when editing is disabled', () => {
		const block1 = createCodeBlockGraphicData({
			code: ['module test1', '; @group audio-chain', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		mockState.graphicHelper.codeBlocks = [block1];
		mockState.featureFlags.editing = false;

		groupNonstickToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleHandler = onCalls[0][1];

		const originalCode = [...block1.code];
		toggleHandler({ codeBlock: block1, makeNonstick: true });

		expect(block1.code).toEqual(originalCode);
	});

	it('should do nothing when code block has no group', () => {
		const block1 = createCodeBlockGraphicData({
			code: ['module test1', 'moduleEnd'],
			blockType: 'module',
		});
		mockState.graphicHelper.codeBlocks = [block1];
		mockState.featureFlags.editing = true;

		groupNonstickToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleHandler = onCalls[0][1];

		const originalCode = [...block1.code];
		toggleHandler({ codeBlock: block1, makeNonstick: true });

		expect(block1.code).toEqual(originalCode);
	});

	it('should update lastUpdated timestamp when toggling', async () => {
		const block1 = createCodeBlockGraphicData({
			code: ['module test1', '; @group audio-chain', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		mockState.graphicHelper.codeBlocks = [block1];
		mockState.featureFlags.editing = true;

		const initialTimestamp = block1.lastUpdated;

		// Wait a tick to ensure time progresses
		await new Promise(resolve => setTimeout(resolve, 1));

		groupNonstickToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleHandler = onCalls[0][1];

		toggleHandler({ codeBlock: block1, makeNonstick: true });

		expect(block1.lastUpdated).toBeGreaterThan(initialTimestamp);
	});

	it('should not change code when already in target state (add nonstick)', () => {
		const block1 = createCodeBlockGraphicData({
			code: ['module test1', '; @group audio-chain nonstick', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
			groupNonstick: true,
		});
		mockState.graphicHelper.codeBlocks = [block1];
		mockState.featureFlags.editing = true;

		groupNonstickToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleHandler = onCalls[0][1];

		const originalCode = [...block1.code];
		toggleHandler({ codeBlock: block1, makeNonstick: true });

		expect(block1.code).toEqual(originalCode);
	});

	it('should not change code when already in target state (remove nonstick)', () => {
		const block1 = createCodeBlockGraphicData({
			code: ['module test1', '; @group audio-chain', 'moduleEnd'],
			blockType: 'module',
			groupName: 'audio-chain',
		});
		mockState.graphicHelper.codeBlocks = [block1];
		mockState.featureFlags.editing = true;

		groupNonstickToggler(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleHandler = onCalls[0][1];

		const originalCode = [...block1.code];
		toggleHandler({ codeBlock: block1, makeNonstick: false });

		expect(block1.code).toEqual(originalCode);
	});
});
