import { parseProjectSource } from '@8f4e/compiler';
import type { State } from '@8f4e/editor-state-types';
import createStateManager from '@8f4e/state-manager';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import { exportFileNameEditorConfigValidator } from '../editorConfig';
import projectExport from '../effect';

describe('projectExport', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let mockExportProject: MockInstance;

	beforeEach(() => {
		mockExportProject = vi.fn().mockResolvedValue(undefined);

		mockState = createMockState({
			callbacks: {
				exportProject: mockExportProject,
			},
		});

		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	describe('Event wiring', () => {
		it('should register the export file name editor config validator', () => {
			projectExport(store, mockEvents);

			expect(mockState.editorConfigValidators.exportFileName).toBe(exportFileNameEditorConfigValidator);
		});

		it('should register exportProject event handler', () => {
			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportProjectCall = onCalls.find(call => call[0] === 'exportProject');
			expect(exportProjectCall).toBeDefined();
		});

		it('should register saveSession event handler', () => {
			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const saveSessionCall = onCalls.find(call => call[0] === 'saveSession');
			expect(saveSessionCall).toBeDefined();
		});

		it('should subscribe to code changes for auto-saving', () => {
			const subscribeSpy = vi.spyOn(store, 'subscribe');

			projectExport(store, mockEvents);

			expect(subscribeSpy).toHaveBeenCalledWith('codeBlockRendering.selectedCodeBlock.code', expect.any(Function));
			expect(subscribeSpy).toHaveBeenCalledWith(
				'codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code',
				expect.any(Function)
			);

			subscribeSpy.mockRestore();
		});
	});

	describe('exportProject', () => {
		it('should export project as .8f4e text', async () => {
			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportProjectCall = onCalls.find(call => call[0] === 'exportProject');
			const exportProjectCallback = exportProjectCall![1];

			await exportProjectCallback();

			expect(mockExportProject).toHaveBeenCalledTimes(1);
			const [exportedText, fileName] = mockExportProject.mock.calls[0];

			expect(fileName).toBe('project.8f4e');
			expect(typeof exportedText).toBe('string');
			expect(exportedText).toMatch(/^8f4e\/v1/);
		});

		it('should warn when no exportProject callback is provided', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

			mockState.callbacks.exportProject = undefined;

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportProjectCall = onCalls.find(call => call[0] === 'exportProject');
			const exportProjectCallback = exportProjectCall![1];

			exportProjectCallback();

			expect(consoleWarnSpy).toHaveBeenCalledWith('No exportProject callback provided');

			consoleWarnSpy.mockRestore();
		});

		it('should handle export errors gracefully', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

			mockState.callbacks.exportProject = vi.fn().mockRejectedValue(new Error('Export failed'));

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportProjectCall = onCalls.find(call => call[0] === 'exportProject');
			const exportProjectCallback = exportProjectCall![1];

			await exportProjectCallback();

			expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save project to file:', expect.any(Error));

			consoleErrorSpy.mockRestore();
		});
	});

	describe('saveProject', () => {
		it('saves canonical text with the configured filename without saving the session', async () => {
			const saveProject = vi.fn().mockResolvedValue(undefined);
			const saveSession = vi.fn().mockResolvedValue(undefined);
			mockState.callbacks.saveProject = saveProject;
			mockState.callbacks.saveSession = saveSession;
			mockState.editorConfig.export = { fileName: 'my-project' };
			projectExport(store, mockEvents);
			const handler = (mockEvents.on as unknown as MockInstance).mock.calls.find(call => call[0] === 'saveProject')![1];
			await handler();
			expect(saveProject).toHaveBeenCalledWith(expect.stringMatching(/^8f4e\/v1/), 'my-project.8f4e');
			expect(saveSession).not.toHaveBeenCalled();
			expect(mockExportProject).not.toHaveBeenCalled();
		});

		it('reports filesystem errors through the editor logger', async () => {
			const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
			mockState.callbacks.saveProject = vi.fn().mockRejectedValue(new Error('denied'));
			projectExport(store, mockEvents);
			const handler = (mockEvents.on as unknown as MockInstance).mock.calls.find(call => call[0] === 'saveProject')![1];
			await handler();
			expect(mockState.console.logs.at(-1)).toMatchObject({
				level: 'error',
				message: 'Failed to save project to file',
			});
			spy.mockRestore();
		});
	});

	describe('exportFileName', () => {
		it('should use custom exportFileName as base for .8f4e export', async () => {
			mockState.editorConfig.export = { fileName: 'my-project' };

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportProjectCallback = onCalls.find(call => call[0] === 'exportProject')![1];

			await exportProjectCallback();

			const [, fileName] = mockExportProject.mock.calls[0];
			expect(fileName).toBe('my-project.8f4e');
		});

		it('should use custom exportFileName as base for WASM export', async () => {
			const mockExportBinaryCode = vi.fn().mockResolvedValue(undefined);
			mockState.callbacks.exportBinaryCode = mockExportBinaryCode;
			mockState.editorConfig.export = { fileName: 'my-project' };

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportWasmCallback = onCalls.find(call => call[0] === 'exportWasm')![1];

			exportWasmCallback();

			expect(mockExportBinaryCode).toHaveBeenCalledWith('my-project.wasm');
		});

		it('should strip .wasm suffix from exportFileName to prevent double extension', async () => {
			const mockExportBinaryCode = vi.fn().mockResolvedValue(undefined);
			mockState.callbacks.exportBinaryCode = mockExportBinaryCode;
			mockState.editorConfig.export = { fileName: 'demo.wasm' };

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportWasmCallback = onCalls.find(call => call[0] === 'exportWasm')![1];

			exportWasmCallback();

			expect(mockExportBinaryCode).toHaveBeenCalledWith('demo.wasm');
		});

		it('should fall back to "project" base when exportFileName is undefined', async () => {
			mockState.editorConfig.export = undefined;

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportProjectCallback = onCalls.find(call => call[0] === 'exportProject')![1];

			await exportProjectCallback();

			const [, fileName] = mockExportProject.mock.calls[0];
			expect(fileName).toBe('project.8f4e');
		});

		it('should fall back to "project" base when exportFileName is empty string', async () => {
			mockState.editorConfig.export = { fileName: '' };

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportProjectCallback = onCalls.find(call => call[0] === 'exportProject')![1];

			await exportProjectCallback();

			const [, fileName] = mockExportProject.mock.calls[0];
			expect(fileName).toBe('project.8f4e');
		});
	});

	describe('saveSession', () => {
		it('saves named notes and their position through the project callbacks, including deletion', async () => {
			const saveSession = vi.fn().mockResolvedValue(undefined);
			const saveProject = vi.fn().mockResolvedValue(undefined);
			mockState.callbacks.saveSession = saveSession;
			mockState.callbacks.saveProject = saveProject;
			const note = createMockCodeBlock({
				blockType: 'note',
				code: ['note local.settings', '; @config font terminus8x16', 'noteEnd'],
			});
			mockState.codeBlockRendering.rootCodeBlocks = [note];
			mockState.codeBlockRendering.codeBlocks = mockState.codeBlockRendering.rootCodeBlocks;
			mockState.codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger = note;
			projectExport(store, mockEvents);
			const code = ['note local.settings', '; @pos 4 8', '; @config font terminus8x16', 'noteEnd'];

			store.set('codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code', code);

			expect(saveSession).toHaveBeenLastCalledWith(expect.objectContaining({ notes: [{ id: 0, code }] }));
			const save = vi.mocked(mockEvents.on).mock.calls.find(call => call[0] === 'saveProject')![1];
			save(undefined);
			expect(parseProjectSource(saveProject.mock.calls[0][0]).notes.map(block => block.code)).toEqual([code]);

			mockState.codeBlockRendering.rootCodeBlocks.splice(0);
			store.set('codeBlockRendering.codeBlocks', mockState.codeBlockRendering.rootCodeBlocks);

			expect(saveSession).toHaveBeenLastCalledWith(expect.objectContaining({ notes: [] }));
		});

		it('should save session when saveSession callback is provided', async () => {
			const mockSaveSession = vi.fn().mockResolvedValue(undefined);
			const mockGetStorageQuota = vi.fn().mockResolvedValue({ usedBytes: 1024, totalBytes: 10240 });
			mockState.callbacks.saveSession = mockSaveSession;
			mockState.callbacks.getStorageQuota = mockGetStorageQuota;
			const rootCodeBlocks = [
				createMockCodeBlock({
					blockType: 'module',
					code: ['module other', 'moduleEnd'],
					entry: 'entry1',
				}),
			];
			mockState.codeBlockRendering.rootCodeBlocks = rootCodeBlocks;
			mockState.codeBlockRendering.codeBlocks = rootCodeBlocks;

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const saveSessionCall = onCalls.find(call => call[0] === 'saveSession');
			const saveSessionCallback = saveSessionCall![1];

			await saveSessionCallback();

			expect(mockSaveSession).toHaveBeenCalled();
			expect(mockSaveSession).toHaveBeenCalledWith({
				code: [],
				modules: [{ id: 0, code: ['module other', 'moduleEnd'], entry: 'entry1' }],
				functions: [],
				constants: [],
				prototypes: [],
				includes: [],
				notes: [],
				unknown: [],
				groups: [],
			});
			expect(mockGetStorageQuota).toHaveBeenCalled();
			expect(mockState.storageQuota.usedBytes).toBe(1024);
		});

		it('should not save session when saveSession callback is absent', async () => {
			const mockSaveSession = vi.fn().mockResolvedValue(undefined);

			mockState.callbacks.saveSession = undefined;

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const saveSessionCall = onCalls.find(call => call[0] === 'saveSession');
			const saveSessionCallback = saveSessionCall![1];

			await saveSessionCallback();

			expect(mockSaveSession).not.toHaveBeenCalled();
		});

		it('should not save session when callback is not provided', async () => {
			mockState.callbacks.saveSession = undefined;

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const saveSessionCall = onCalls.find(call => call[0] === 'saveSession');
			const saveSessionCallback = saveSessionCall![1];

			// Should not throw error
			await expect(saveSessionCallback()).resolves.toBeUndefined();
		});

		it('should trigger saveSession on code changes', async () => {
			const mockSaveSession = vi.fn().mockResolvedValue(undefined);
			const mockGetStorageQuota = vi.fn().mockResolvedValue({ usedBytes: 1024, totalBytes: 10240 });

			mockState.callbacks.saveSession = mockSaveSession;
			mockState.callbacks.saveProject = vi.fn().mockResolvedValue(undefined);
			mockState.callbacks.getStorageQuota = mockGetStorageQuota;

			const subscribeSpy = vi.spyOn(store, 'subscribe');

			projectExport(store, mockEvents);

			// Find the code change callback
			const codeChangeCall = subscribeSpy.mock.calls.find(
				call => call[0] === 'codeBlockRendering.selectedCodeBlock.code'
			);
			expect(codeChangeCall).toBeDefined();
			const programmaticChangeCall = subscribeSpy.mock.calls.find(
				call => call[0] === 'codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code'
			);
			expect(programmaticChangeCall).toBeDefined();

			const codeChangeCallback = codeChangeCall![1];
			await codeChangeCallback();

			expect(mockSaveSession).toHaveBeenCalled();
			expect(mockState.callbacks.saveProject).not.toHaveBeenCalled();

			subscribeSpy.mockRestore();
		});
	});
});
