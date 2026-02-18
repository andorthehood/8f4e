import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import codeBlockCreator from './effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

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

			// Verify code block was added with clipboard content (now includes @pos)
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(1);
			expect(mockState.graphicHelper.codeBlocks[0].code[0]).toBe('module test');
			expect(mockState.graphicHelper.codeBlocks[0].code[1]).toMatch(/^; @pos \d+ \d+$/);
			expect(mockState.graphicHelper.codeBlocks[0].code[2]).toBe('');
			expect(mockState.graphicHelper.codeBlocks[0].code[3]).toBe('moduleEnd');
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
			const testCodeBlock = createMockCodeBlock({
				id: 'test',
				code: ['module test', '', 'moduleEnd'],
				blockType: 'module',
			});
			mockState.graphicHelper.codeBlocks = [testCodeBlock];

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
			const testCodeBlock = createMockCodeBlock({
				id: 'test',
				code: ['module test', '', 'moduleEnd'],
				blockType: 'module',
			});
			mockState.graphicHelper.codeBlocks = [testCodeBlock];

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
			const testCodeBlock = createMockCodeBlock({
				id: 'test',
				code: ['module test', '', 'moduleEnd'],
				blockType: 'module',
			});
			mockState.graphicHelper.codeBlocks = [testCodeBlock];

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

	describe('addCodeBlockBySlug with dependencies', () => {
		it('should insert dependencies to the right of the requested module', async () => {
			const mockGetModule = vi.fn();
			mockGetModule.mockImplementation(async (slug: string) => {
				if (slug === 'main') {
					return {
						title: 'Main Module',
						author: 'Test',
						code: 'module main\n\nmoduleEnd',
						tests: [],
						category: 'Test',
						dependencies: ['dep1', 'dep2'],
					};
				} else if (slug === 'dep1') {
					return {
						title: 'Dependency 1',
						author: 'Test',
						code: 'module dep1\n\nmoduleEnd',
						tests: [],
						category: 'Test',
					};
				} else if (slug === 'dep2') {
					return {
						title: 'Dependency 2',
						author: 'Test',
						code: 'module dep2\n\nmoduleEnd',
						tests: [],
						category: 'Test',
					};
				}
				throw new Error('Module not found');
			});

			mockState.callbacks.getModule = mockGetModule;
			mockState.featureFlags.editing = true;

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockBySlugCall = onCalls.find(call => call[0] === 'addCodeBlockBySlug');
			const addCodeBlockBySlugCallback = addCodeBlockBySlugCall![1];

			// Trigger add with dependencies
			await addCodeBlockBySlugCallback({ codeBlockSlug: 'main', x: 100, y: 100 });

			// Verify all modules were added
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(3);
			expect(mockState.graphicHelper.codeBlocks[0].id).toBe('main');
			expect(mockState.graphicHelper.codeBlocks[1].id).toBe('dep1');
			expect(mockState.graphicHelper.codeBlocks[2].id).toBe('dep2');

			// Verify positions - dep1 should be to the right of main
			expect(mockState.graphicHelper.codeBlocks[1].gridX).toBeGreaterThan(mockState.graphicHelper.codeBlocks[0].gridX);
			// Verify positions - dep2 should be to the right of dep1
			expect(mockState.graphicHelper.codeBlocks[2].gridX).toBeGreaterThan(mockState.graphicHelper.codeBlocks[1].gridX);
		});

		it('should skip dependencies that already exist', async () => {
			const mockGetModule = vi.fn();
			mockGetModule.mockImplementation(async (slug: string) => {
				if (slug === 'main') {
					return {
						title: 'Main Module',
						author: 'Test',
						code: 'module main\n\nmoduleEnd',
						tests: [],
						category: 'Test',
						dependencies: ['dep1', 'dep2'],
					};
				} else if (slug === 'dep1') {
					return {
						title: 'Dependency 1',
						author: 'Test',
						code: 'module dep1\n\nmoduleEnd',
						tests: [],
						category: 'Test',
					};
				} else if (slug === 'dep2') {
					return {
						title: 'Dependency 2',
						author: 'Test',
						code: 'module dep2\n\nmoduleEnd',
						tests: [],
						category: 'Test',
					};
				}
				throw new Error('Module not found');
			});

			mockState.callbacks.getModule = mockGetModule;
			mockState.featureFlags.editing = true;

			// Pre-populate with dep1
			const existingDep1 = createMockCodeBlock({
				id: 'dep1',
				code: ['module dep1', '', 'moduleEnd'],
				blockType: 'module',
			});
			mockState.graphicHelper.codeBlocks = [existingDep1];

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockBySlugCall = onCalls.find(call => call[0] === 'addCodeBlockBySlug');
			const addCodeBlockBySlugCallback = addCodeBlockBySlugCall![1];

			// Trigger add with dependencies
			await addCodeBlockBySlugCallback({ codeBlockSlug: 'main', x: 100, y: 100 });

			// Verify only main and dep2 were added (dep1 already existed)
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(3);
			expect(mockState.graphicHelper.codeBlocks[0].id).toBe('dep1'); // Existing
			expect(mockState.graphicHelper.codeBlocks[1].id).toBe('main'); // New
			expect(mockState.graphicHelper.codeBlocks[2].id).toBe('dep2'); // New
		});

		it('should work without dependencies field', async () => {
			const mockGetModule = vi.fn().mockResolvedValue({
				title: 'Simple Module',
				author: 'Test',
				code: 'module simple\n\nmoduleEnd',
				tests: [],
				category: 'Test',
				// No dependencies field
			});

			mockState.callbacks.getModule = mockGetModule;
			mockState.featureFlags.editing = true;

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockBySlugCall = onCalls.find(call => call[0] === 'addCodeBlockBySlug');
			const addCodeBlockBySlugCallback = addCodeBlockBySlugCall![1];

			// Trigger add without dependencies
			await addCodeBlockBySlugCallback({ codeBlockSlug: 'simple', x: 100, y: 100 });

			// Verify only the main module was added
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(1);
			expect(mockState.graphicHelper.codeBlocks[0].id).toBe('simple');
		});

		it('should handle dependency loading errors gracefully', async () => {
			const mockGetModule = vi.fn();
			mockGetModule.mockImplementation(async (slug: string) => {
				if (slug === 'main') {
					return {
						title: 'Main Module',
						author: 'Test',
						code: 'module main\n\nmoduleEnd',
						tests: [],
						category: 'Test',
						dependencies: ['dep1', 'missing'],
					};
				} else if (slug === 'dep1') {
					return {
						title: 'Dependency 1',
						author: 'Test',
						code: 'module dep1\n\nmoduleEnd',
						tests: [],
						category: 'Test',
					};
				}
				throw new Error('Module not found');
			});

			mockState.callbacks.getModule = mockGetModule;
			mockState.featureFlags.editing = true;

			// Mock console.warn to verify error handling
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockBySlugCall = onCalls.find(call => call[0] === 'addCodeBlockBySlug');
			const addCodeBlockBySlugCallback = addCodeBlockBySlugCall![1];

			// Trigger add with dependencies (one fails)
			await addCodeBlockBySlugCallback({ codeBlockSlug: 'main', x: 100, y: 100 });

			// Verify main and dep1 were added, but missing was skipped
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(2);
			expect(mockState.graphicHelper.codeBlocks[0].id).toBe('main');
			expect(mockState.graphicHelper.codeBlocks[1].id).toBe('dep1');

			// Verify warning was logged
			expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load dependency: missing', expect.any(Error));

			consoleWarnSpy.mockRestore();
		});

		it('should use correct grid positioning for dependencies', async () => {
			const mockGetModule = vi.fn();
			mockGetModule.mockImplementation(async (slug: string) => {
				if (slug === 'main') {
					return {
						title: 'Main Module',
						author: 'Test',
						code: 'module main\nlong line of code here\nmoduleEnd',
						tests: [],
						category: 'Test',
						dependencies: ['dep1'],
					};
				} else if (slug === 'dep1') {
					return {
						title: 'Dependency 1',
						author: 'Test',
						code: 'module dep1\n\nmoduleEnd',
						tests: [],
						category: 'Test',
					};
				}
				throw new Error('Module not found');
			});

			mockState.callbacks.getModule = mockGetModule;
			mockState.featureFlags.editing = true;
			mockState.viewport.vGrid = 8; // 8 pixels per grid unit

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockBySlugCall = onCalls.find(call => call[0] === 'addCodeBlockBySlug');
			const addCodeBlockBySlugCallback = addCodeBlockBySlugCall![1];

			// Trigger add with dependencies
			await addCodeBlockBySlugCallback({ codeBlockSlug: 'main', x: 100, y: 100 });

			// Verify both modules were added
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(2);

			// Calculate expected positions
			const mainModule = mockState.graphicHelper.codeBlocks[0];
			const dep1Module = mockState.graphicHelper.codeBlocks[1];

			// Main module should be at the clicked grid position
			expect(mainModule.gridX).toBeCloseTo(Math.round((mockState.viewport.x + 100) / mockState.viewport.vGrid), 0);

			// Dep1 should be positioned to the right with correct spacing
			// The exact value depends on the grid width calculation
			expect(dep1Module.gridX).toBeGreaterThan(mainModule.gridX);
		});

		it('should only skip dependencies of the same block type', async () => {
			const mockGetModule = vi.fn();
			mockGetModule.mockImplementation(async (slug: string) => {
				if (slug === 'main') {
					return {
						title: 'Main Module',
						author: 'Test',
						code: 'module main\n\nmoduleEnd',
						tests: [],
						category: 'Test',
						dependencies: ['sine'],
					};
				} else if (slug === 'sine') {
					return {
						title: 'Sine Function',
						author: 'Test',
						code: 'function sine\nparam float x\nfunctionEnd float',
						tests: [],
						category: 'Test',
					};
				}
				throw new Error('Module not found');
			});

			mockState.callbacks.getModule = mockGetModule;
			mockState.featureFlags.editing = true;

			// Pre-populate with a module named 'sine' (different type from the function dependency)
			const existingSineModule = createMockCodeBlock({
				id: 'sine',
				code: ['module sine', '', 'moduleEnd'],
				blockType: 'module',
			});
			mockState.graphicHelper.codeBlocks = [existingSineModule];

			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockBySlugCall = onCalls.find(call => call[0] === 'addCodeBlockBySlug');
			const addCodeBlockBySlugCallback = addCodeBlockBySlugCall![1];

			// Trigger add with dependencies
			await addCodeBlockBySlugCallback({ codeBlockSlug: 'main', x: 100, y: 100 });

			// Verify main was added and sine function was also added (not skipped)
			// because the existing 'sine' is a module, not a function
			// Note: The sine function's ID will be auto-incremented to 'sine2' by the
			// existing ID uniqueness logic in onAddCodeBlock
			expect(mockState.graphicHelper.codeBlocks).toHaveLength(3);
			expect(mockState.graphicHelper.codeBlocks[0].id).toBe('sine'); // Existing module
			expect(mockState.graphicHelper.codeBlocks[0].blockType).toBe('module');
			expect(mockState.graphicHelper.codeBlocks[1].id).toBe('main'); // New module
			expect(mockState.graphicHelper.codeBlocks[2].id).toBe('sine2'); // New function (ID incremented)
			// Check the code contains function markers
			expect(mockState.graphicHelper.codeBlocks[2].code.join('\n')).toContain('function sine2');
		});
	});
});

describe('codeBlockCreator - toggleCodeBlockDisabled', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	it('should toggle disabled state from false to true', () => {
		const codeBlock = createMockCodeBlock({ disabled: false });
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		codeBlockCreator(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleCodeBlockDisabled');
		expect(toggleCall).toBeDefined();

		const toggleCallback = toggleCall![1];
		toggleCallback({ codeBlock });

		expect(codeBlock.disabled).toBe(true);
	});

	it('should toggle disabled state from true to false', () => {
		const codeBlock = createMockCodeBlock({ disabled: true });
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		codeBlockCreator(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleCodeBlockDisabled');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(codeBlock.disabled).toBe(false);
	});

	it('should update lastUpdated for cache invalidation', () => {
		const codeBlock = createMockCodeBlock({ disabled: false, lastUpdated: 1000 });
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		codeBlockCreator(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleCodeBlockDisabled');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(codeBlock.lastUpdated).toBeGreaterThan(1000);
	});

	it('should trigger store update', () => {
		const codeBlock = createMockCodeBlock({ disabled: false });
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		codeBlockCreator(store, mockEvents);

		const setSpy = vi.spyOn(store, 'set');

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleCodeBlockDisabled');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(setSpy).toHaveBeenCalledWith('graphicHelper.selectedCodeBlockForProgrammaticEdit', codeBlock);
	});

	it('should not toggle when editing is disabled', () => {
		const codeBlock = createMockCodeBlock({ disabled: false });
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = false;

		codeBlockCreator(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleCodeBlockDisabled');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(codeBlock.disabled).toBe(false);
	});

	it('should add @disabled directive when enabling disabled', () => {
		const codeBlock = createMockCodeBlock({ code: ['module test', 'moduleEnd'], disabled: false });
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		codeBlockCreator(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleCodeBlockDisabled');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(codeBlock.code).toContain('; @disabled');
		expect(codeBlock.disabled).toBe(true);
	});

	it('should remove @disabled directive when disabling disabled', () => {
		const codeBlock = createMockCodeBlock({ code: ['module test', '; @disabled', 'moduleEnd'], disabled: true });
		mockState.graphicHelper.codeBlocks = [codeBlock];
		mockState.featureFlags.editing = true;

		codeBlockCreator(store, mockEvents);

		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const toggleCall = onCalls.find(call => call[0] === 'toggleCodeBlockDisabled');
		const toggleCallback = toggleCall![1];

		toggleCallback({ codeBlock });

		expect(codeBlock.code).not.toContain('; @disabled');
		expect(codeBlock.disabled).toBe(false);
	});
});
