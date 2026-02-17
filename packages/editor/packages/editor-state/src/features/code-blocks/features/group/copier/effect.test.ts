import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import groupCopier from './effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('groupCopier', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	it('should copy group blocks as JSON array', async () => {
		const mockWriteClipboard = vi.fn().mockResolvedValue(undefined);
		mockState.callbacks.writeClipboardText = mockWriteClipboard;

		const block1 = createMockCodeBlock({
			code: ['module foo', '; @group audio', 'moduleEnd'],
			gridX: 10,
			gridY: 20,
			groupName: 'audio',
		});

		const block2 = createMockCodeBlock({
			code: ['module bar', '; @group audio', 'moduleEnd'],
			gridX: 22,
			gridY: 24,
			groupName: 'audio',
		});

		mockState.graphicHelper.codeBlocks = [block1, block2];

		groupCopier(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const copyGroupCall = onCalls.find(call => call[0] === 'copyGroupBlocks');
		const copyGroupCallback = copyGroupCall![1];

		copyGroupCallback({ codeBlock: block1 });
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(mockWriteClipboard).toHaveBeenCalled();
		const clipboardContent = mockWriteClipboard.mock.calls[0][0];
		const parsed = JSON.parse(clipboardContent);

		expect(Array.isArray(parsed)).toBe(true);
		expect(parsed).toHaveLength(2);
	});

	it('should fallback to single copy when block has no group', async () => {
		const mockWriteClipboard = vi.fn().mockResolvedValue(undefined);
		mockState.callbacks.writeClipboardText = mockWriteClipboard;

		const block1 = createMockCodeBlock({
			code: ['module foo', 'moduleEnd'],
			groupName: undefined,
		});

		mockState.graphicHelper.codeBlocks = [block1];

		groupCopier(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const copyGroupCall = onCalls.find(call => call[0] === 'copyGroupBlocks');
		const copyGroupCallback = copyGroupCall![1];

		copyGroupCallback({ codeBlock: block1 });
		await new Promise(resolve => setTimeout(resolve, 0));

		const clipboardContent = mockWriteClipboard.mock.calls[0][0];
		expect(clipboardContent).toBe('module foo\nmoduleEnd');
	});
});
