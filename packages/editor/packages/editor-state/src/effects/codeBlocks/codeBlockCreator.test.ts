import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import codeBlockCreator from './codeBlockCreator';

import { createMockState } from '../../pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../../pureHelpers/testingUtils/vitestTestUtils';

import type { State } from '../../types';

describe('codeBlockCreator - clipboard callbacks', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	describe('Paste Module (readClipboardText callback)', () => {
		it('should read from clipboard callback when pasting a module', async () => {
			const mockReadClipboard = vi.fn().mockResolvedValue('module test\n\nmoduleEnd');
			mockState.callbacks.readClipboardText = mockReadClipboard;
			mockState.featureFlags.editing = true;

			codeBlockCreator(store, mockEvents);

			// Find the addCodeBlock event handler
			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			expect(addCodeBlockCall).toBeDefined();

			const addCodeBlockCallback = addCodeBlockCall![1];

			// Trigger paste module (code.length < 2 triggers clipboard read)
			await addCodeBlockCallback({ x: 100, y: 100, isNew: false, code: [''] });

			// Verify clipboard was read
			expect(mockReadClipboard).toHaveBeenCalled();

			// Verify code block was added with clipboard content
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(1);
			expect(mockState.graphicHelper.codeBlocks[0].code).toEqual(['module test', '', 'moduleEnd']);
		});

		it('should fail silently when readClipboardText is not provided', async () => {
			mockState.callbacks.readClipboardText = undefined;
			mockState.featureFlags.editing = true;

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			const addCodeBlockCallback = addCodeBlockCall![1];

			// Trigger paste module (code.length < 2 triggers clipboard read)
			await addCodeBlockCallback({ x: 100, y: 100, isNew: false, code: [''] });

			// Verify no code block was added
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(0);
		});

		it('should fail silently when clipboard read fails', async () => {
			const mockReadClipboard = vi.fn().mockRejectedValue(new Error('Clipboard read failed'));
			mockState.callbacks.readClipboardText = mockReadClipboard;
			mockState.featureFlags.editing = true;

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			const addCodeBlockCallback = addCodeBlockCall![1];

			// Trigger paste module (code.length < 2 triggers clipboard read)
			await addCodeBlockCallback({ x: 100, y: 100, isNew: false, code: [''] });

			// Verify clipboard was attempted
			expect(mockReadClipboard).toHaveBeenCalled();

			// Verify no code block was added (silent failure)
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(0);
		});
	});

	describe('Copy Module (writeClipboardText callback)', () => {
		it('should write to clipboard callback when copying a module', async () => {
			const mockWriteClipboard = vi.fn().mockResolvedValue(undefined);
			mockState.callbacks.writeClipboardText = mockWriteClipboard;

			// Add a code block to copy
			mockState.graphicHelper.codeBlocks = [
				{
					id: 'test',
					code: ['module test', '', 'moduleEnd'],
					x: 0,
					y: 0,
					gridX: 0,
					gridY: 0,
					width: 100,
					height: 100,
					minGridWidth: 32,
					codeColors: [],
					codeToRender: [],
					extras: {
						blockHighlights: [],
						inputs: [],
						outputs: [],
						debuggers: [],
						switches: [],
						buttons: [],
						pianoKeyboards: [],
						bufferPlotters: [],
						errorMessages: [],
					},
					cursor: { col: 0, row: 0, x: 0, y: 0 },
					gaps: new Map(),
					lineNumberColumnWidth: 2,
					offsetX: 0,
					offsetY: 0,
					lastUpdated: Date.now(),
					creationIndex: 0,
					blockType: 'module',
				},
			];

			codeBlockCreator(store, mockEvents);

			// Find the copyCodeBlock event handler
			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const copyCodeBlockCall = onCalls.find(call => call[0] === 'copyCodeBlock');
			expect(copyCodeBlockCall).toBeDefined();

			const copyCodeBlockCallback = copyCodeBlockCall![1];

			// Trigger copy
			copyCodeBlockCallback({ codeBlock: mockState.graphicHelper.codeBlocks[0] });

			// Wait for async operation
			await new Promise(resolve => setTimeout(resolve, 0));

			// Verify clipboard was written
			expect(mockWriteClipboard).toHaveBeenCalledWith('module test\n\nmoduleEnd');
		});

		it('should fail silently when writeClipboardText is not provided', () => {
			mockState.callbacks.writeClipboardText = undefined;

			// Add a code block to copy
			mockState.graphicHelper.codeBlocks = [
				{
					id: 'test',
					code: ['module test', '', 'moduleEnd'],
					x: 0,
					y: 0,
					gridX: 0,
					gridY: 0,
					width: 100,
					height: 100,
					minGridWidth: 32,
					codeColors: [],
					codeToRender: [],
					extras: {
						blockHighlights: [],
						inputs: [],
						outputs: [],
						debuggers: [],
						switches: [],
						buttons: [],
						pianoKeyboards: [],
						bufferPlotters: [],
						errorMessages: [],
					},
					cursor: { col: 0, row: 0, x: 0, y: 0 },
					gaps: new Map(),
					lineNumberColumnWidth: 2,
					offsetX: 0,
					offsetY: 0,
					lastUpdated: Date.now(),
					creationIndex: 0,
					blockType: 'module',
				},
			];

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const copyCodeBlockCall = onCalls.find(call => call[0] === 'copyCodeBlock');
			const copyCodeBlockCallback = copyCodeBlockCall![1];

			// Trigger copy - should not throw
			expect(() => {
				copyCodeBlockCallback({ codeBlock: mockState.graphicHelper.codeBlocks[0] });
			}).not.toThrow();
		});

		it('should fail silently when clipboard write fails', async () => {
			const mockWriteClipboard = vi.fn().mockRejectedValue(new Error('Clipboard write failed'));
			mockState.callbacks.writeClipboardText = mockWriteClipboard;

			// Add a code block to copy
			mockState.graphicHelper.codeBlocks = [
				{
					id: 'test',
					code: ['module test', '', 'moduleEnd'],
					x: 0,
					y: 0,
					gridX: 0,
					gridY: 0,
					width: 100,
					height: 100,
					minGridWidth: 32,
					codeColors: [],
					codeToRender: [],
					extras: {
						blockHighlights: [],
						inputs: [],
						outputs: [],
						debuggers: [],
						switches: [],
						buttons: [],
						pianoKeyboards: [],
						bufferPlotters: [],
						errorMessages: [],
					},
					cursor: { col: 0, row: 0, x: 0, y: 0 },
					gaps: new Map(),
					lineNumberColumnWidth: 2,
					offsetX: 0,
					offsetY: 0,
					lastUpdated: Date.now(),
					creationIndex: 0,
					blockType: 'module',
				},
			];

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const copyCodeBlockCall = onCalls.find(call => call[0] === 'copyCodeBlock');
			const copyCodeBlockCallback = copyCodeBlockCall![1];

			// Trigger copy
			copyCodeBlockCallback({ codeBlock: mockState.graphicHelper.codeBlocks[0] });

			// Wait for async operation
			await new Promise(resolve => setTimeout(resolve, 0));

			// Verify clipboard write was attempted
			expect(mockWriteClipboard).toHaveBeenCalled();
			// No error should be thrown (silent failure)
		});
	});
});
