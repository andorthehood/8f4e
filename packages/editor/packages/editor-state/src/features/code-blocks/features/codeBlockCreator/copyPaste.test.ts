import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import codeBlockCreator from './effect';

import groupCopier from '../group/copier/effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('codeBlockCreator - group copy/paste', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	describe('Copy Group', () => {
		it('should serialize group blocks as JSON array with relative coordinates', async () => {
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

			// Trigger copy group with block1 as anchor
			copyGroupCallback({ codeBlock: block1 });

			await new Promise(resolve => setTimeout(resolve, 0));

			// Verify clipboard was written with JSON array
			expect(mockWriteClipboard).toHaveBeenCalled();
			const clipboardContent = mockWriteClipboard.mock.calls[0][0];
			const parsed = JSON.parse(clipboardContent);

			expect(Array.isArray(parsed)).toBe(true);
			expect(parsed).toHaveLength(2);

			// block1 should be anchor (0, 0)
			expect(parsed[0].code).toEqual(['module foo', '; @group audio', 'moduleEnd']);
			expect(parsed[0].gridCoordinates).toEqual({ x: 0, y: 0 });

			// block2 should have relative coordinates
			expect(parsed[1].code).toEqual(['module bar', '; @group audio', 'moduleEnd']);
			expect(parsed[1].gridCoordinates).toEqual({ x: 12, y: 4 });
		});

		it('should include disabled flag in serialized blocks', async () => {
			const mockWriteClipboard = vi.fn().mockResolvedValue(undefined);
			mockState.callbacks.writeClipboardText = mockWriteClipboard;

			const block1 = createMockCodeBlock({
				code: ['module foo', '; @group audio', 'moduleEnd'],
				gridX: 0,
				gridY: 0,
				groupName: 'audio',
				disabled: true,
			});

			mockState.graphicHelper.codeBlocks = [block1];

			groupCopier(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const copyGroupCall = onCalls.find(call => call[0] === 'copyGroupBlocks');
			const copyGroupCallback = copyGroupCall![1];

			copyGroupCallback({ codeBlock: block1 });
			await new Promise(resolve => setTimeout(resolve, 0));

			const clipboardContent = mockWriteClipboard.mock.calls[0][0];
			const parsed = JSON.parse(clipboardContent);

			expect(parsed[0].disabled).toBe(true);
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

			// Should have written plain text, not JSON
			const clipboardContent = mockWriteClipboard.mock.calls[0][0];
			expect(clipboardContent).toBe('module foo\nmoduleEnd');
		});

		it('should order blocks by creation index', async () => {
			const mockWriteClipboard = vi.fn().mockResolvedValue(undefined);
			mockState.callbacks.writeClipboardText = mockWriteClipboard;

			const block1 = createMockCodeBlock({
				code: ['module foo', '; @group audio', 'moduleEnd'],
				groupName: 'audio',
				creationIndex: 2,
			});

			const block2 = createMockCodeBlock({
				code: ['module bar', '; @group audio', 'moduleEnd'],
				groupName: 'audio',
				creationIndex: 1,
			});

			const block3 = createMockCodeBlock({
				code: ['module baz', '; @group audio', 'moduleEnd'],
				groupName: 'audio',
				creationIndex: 3,
			});

			mockState.graphicHelper.codeBlocks = [block1, block2, block3];

			groupCopier(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const copyGroupCall = onCalls.find(call => call[0] === 'copyGroupBlocks');
			const copyGroupCallback = copyGroupCall![1];

			copyGroupCallback({ codeBlock: block1 });
			await new Promise(resolve => setTimeout(resolve, 0));

			const clipboardContent = mockWriteClipboard.mock.calls[0][0];
			const parsed = JSON.parse(clipboardContent);

			// Should be ordered by creation index: block2, block1, block3
			expect(parsed[0].code[0]).toBe('module bar');
			expect(parsed[1].code[0]).toBe('module foo');
			expect(parsed[2].code[0]).toBe('module baz');
		});
	});

	describe('Multi-block Paste', () => {
		it('should detect and paste valid multi-block JSON array', async () => {
			const clipboardData = JSON.stringify([
				{ code: ['module foo', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } },
				{ code: ['module bar', 'moduleEnd'], gridCoordinates: { x: 5, y: 3 } },
			]);

			const mockReadClipboard = vi.fn().mockResolvedValue(clipboardData);
			mockState.callbacks.readClipboardText = mockReadClipboard;
			mockState.featureFlags.editing = true;
			mockState.viewport.vGrid = 8;
			mockState.viewport.hGrid = 8;

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			const addCodeBlockCallback = addCodeBlockCall![1];

			// Trigger paste at position (100, 100)
			await addCodeBlockCallback({ x: 100, y: 100, isNew: false, code: [''] });

			// Verify two blocks were created
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(2);

			// Verify first block is at paste anchor position
			const anchorGridX = Math.round(100 / 8);
			const anchorGridY = Math.round(100 / 8);
			expect(mockState.graphicHelper.codeBlocks[0].gridX).toBe(anchorGridX);
			expect(mockState.graphicHelper.codeBlocks[0].gridY).toBe(anchorGridY);

			// Verify second block has relative offset
			expect(mockState.graphicHelper.codeBlocks[1].gridX).toBe(anchorGridX + 5);
			expect(mockState.graphicHelper.codeBlocks[1].gridY).toBe(anchorGridY + 3);
		});

		it('should preserve disabled flag on pasted blocks', async () => {
			const clipboardData = JSON.stringify([
				{ code: ['module foo', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 }, disabled: true },
				{ code: ['module bar', 'moduleEnd'], gridCoordinates: { x: 5, y: 3 }, disabled: false },
			]);

			const mockReadClipboard = vi.fn().mockResolvedValue(clipboardData);
			mockState.callbacks.readClipboardText = mockReadClipboard;
			mockState.featureFlags.editing = true;

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			const addCodeBlockCallback = addCodeBlockCall![1];

			await addCodeBlockCallback({ x: 100, y: 100, isNew: false, code: [''] });

			expect(mockState.graphicHelper.codeBlocks[0].disabled).toBe(true);
			expect(mockState.graphicHelper.codeBlocks[1].disabled).toBe(false);
		});

		it('should rename colliding group names on paste', async () => {
			// Existing block with group name "audio"
			const existingBlock = createMockCodeBlock({
				code: ['module existing', '; @group audio', 'moduleEnd'],
				groupName: 'audio',
			});
			mockState.graphicHelper.codeBlocks = [existingBlock];

			// Paste blocks with same group name
			const clipboardData = JSON.stringify([
				{ code: ['module foo', '; @group audio', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } },
				{ code: ['module bar', '; @group audio', 'moduleEnd'], gridCoordinates: { x: 5, y: 3 } },
			]);

			const mockReadClipboard = vi.fn().mockResolvedValue(clipboardData);
			mockState.callbacks.readClipboardText = mockReadClipboard;
			mockState.featureFlags.editing = true;

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			const addCodeBlockCallback = addCodeBlockCall![1];

			await addCodeBlockCallback({ x: 100, y: 100, isNew: false, code: [''] });

			// Original block should still have "audio"
			expect(mockState.graphicHelper.codeBlocks[0].code[1]).toBe('; @group audio');

			// Pasted blocks should have renamed group "audio1"
			expect(mockState.graphicHelper.codeBlocks[1].code[1]).toBe('; @group audio1');
			expect(mockState.graphicHelper.codeBlocks[2].code[1]).toBe('; @group audio1');
		});

		it('should handle multiple different group names in paste', async () => {
			const existingBlock1 = createMockCodeBlock({
				code: ['module existing1', '; @group audio', 'moduleEnd'],
				groupName: 'audio',
			});
			const existingBlock2 = createMockCodeBlock({
				code: ['module existing2', '; @group video', 'moduleEnd'],
				groupName: 'video',
			});
			mockState.graphicHelper.codeBlocks = [existingBlock1, existingBlock2];

			const clipboardData = JSON.stringify([
				{ code: ['module foo', '; @group audio', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } },
				{ code: ['module bar', '; @group video', 'moduleEnd'], gridCoordinates: { x: 5, y: 0 } },
				{ code: ['module baz', '; @group audio', 'moduleEnd'], gridCoordinates: { x: 10, y: 0 } },
			]);

			const mockReadClipboard = vi.fn().mockResolvedValue(clipboardData);
			mockState.callbacks.readClipboardText = mockReadClipboard;
			mockState.featureFlags.editing = true;

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			const addCodeBlockCallback = addCodeBlockCall![1];

			await addCodeBlockCallback({ x: 100, y: 100, isNew: false, code: [''] });

			// audio -> audio1, video -> video1
			expect(mockState.graphicHelper.codeBlocks[2].code[1]).toBe('; @group audio1');
			expect(mockState.graphicHelper.codeBlocks[3].code[1]).toBe('; @group video1');
			expect(mockState.graphicHelper.codeBlocks[4].code[1]).toBe('; @group audio1'); // Same as first
		});

		it('should fallback to single-block paste for invalid JSON', async () => {
			const clipboardData = 'module test\n\nmoduleEnd';

			const mockReadClipboard = vi.fn().mockResolvedValue(clipboardData);
			mockState.callbacks.readClipboardText = mockReadClipboard;
			mockState.featureFlags.editing = true;

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			const addCodeBlockCallback = addCodeBlockCall![1];

			await addCodeBlockCallback({ x: 100, y: 100, isNew: false, code: [''] });

			// Should create one block with plain text
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(1);
			expect(mockState.graphicHelper.codeBlocks[0].code).toEqual(['module test', '', 'moduleEnd']);
		});

		it('should fallback to single-block paste for array with only 1 item', async () => {
			const clipboardData = JSON.stringify([{ code: ['module foo', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } }]);

			const mockReadClipboard = vi.fn().mockResolvedValue(clipboardData);
			mockState.callbacks.readClipboardText = mockReadClipboard;
			mockState.featureFlags.editing = true;

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			const addCodeBlockCallback = addCodeBlockCall![1];

			await addCodeBlockCallback({ x: 100, y: 100, isNew: false, code: [''] });

			// Should fallback to single paste
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(1);
		});

		it('should update module IDs to avoid collisions', async () => {
			const existingBlock = createMockCodeBlock({
				id: 'foo',
				code: ['module foo', 'moduleEnd'],
			});
			mockState.graphicHelper.codeBlocks = [existingBlock];

			const clipboardData = JSON.stringify([
				{ code: ['module foo', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } },
				{ code: ['module foo', 'moduleEnd'], gridCoordinates: { x: 5, y: 0 } },
			]);

			const mockReadClipboard = vi.fn().mockResolvedValue(clipboardData);
			mockState.callbacks.readClipboardText = mockReadClipboard;
			mockState.featureFlags.editing = true;

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			const addCodeBlockCallback = addCodeBlockCall![1];

			await addCodeBlockCallback({ x: 100, y: 100, isNew: false, code: [''] });

			// Pasted blocks should have unique IDs
			expect(mockState.graphicHelper.codeBlocks[1].id).not.toBe('foo');
			expect(mockState.graphicHelper.codeBlocks[2].id).not.toBe('foo');
			expect(mockState.graphicHelper.codeBlocks[1].id).not.toBe(mockState.graphicHelper.codeBlocks[2].id);
		});

		it('should preserve nonstick flag in group directive', async () => {
			const clipboardData = JSON.stringify([
				{ code: ['module foo', '; @group audio nonstick', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } },
				{ code: ['module bar', '; @group audio nonstick', 'moduleEnd'], gridCoordinates: { x: 5, y: 0 } },
			]);

			const mockReadClipboard = vi.fn().mockResolvedValue(clipboardData);
			mockState.callbacks.readClipboardText = mockReadClipboard;
			mockState.featureFlags.editing = true;

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			const addCodeBlockCallback = addCodeBlockCall![1];

			await addCodeBlockCallback({ x: 100, y: 100, isNew: false, code: [''] });

			// Nonstick flag should be preserved
			expect(mockState.graphicHelper.codeBlocks[0].code[1]).toContain('nonstick');
			expect(mockState.graphicHelper.codeBlocks[1].code[1]).toContain('nonstick');
		});
	});
});
