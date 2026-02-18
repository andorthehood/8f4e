import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import projectExport from '../effect';

import type { State } from '~/types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

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
		it('should register exportProject event handler', () => {
			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportProjectCall = onCalls.find(call => call[0] === 'exportProject');
			expect(exportProjectCall).toBeDefined();
		});

		it('should register exportRuntimeReadyProject event handler', () => {
			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportRuntimeReadyProjectCall = onCalls.find(call => call[0] === 'exportRuntimeReadyProject');
			expect(exportRuntimeReadyProjectCall).toBeDefined();
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

			expect(subscribeSpy).toHaveBeenCalledWith('graphicHelper.selectedCodeBlock.code', expect.any(Function));
			expect(subscribeSpy).toHaveBeenCalledWith(
				'graphicHelper.selectedCodeBlockForProgrammaticEdit.code',
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

	describe('exportRuntimeReadyProject', () => {
		it('should export runtime-ready project with compiled modules', async () => {
			mockState.compiler.compiledModules = { mod: {} };
			mockState.compiler.allocatedMemorySize = 6;

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportRuntimeReadyProjectCall = onCalls.find(call => call[0] === 'exportRuntimeReadyProject');
			const exportRuntimeReadyProjectCallback = exportRuntimeReadyProjectCall![1];

			await exportRuntimeReadyProjectCallback();

			expect(mockExportProject).toHaveBeenCalledTimes(1);
			const [exportedJson, fileName] = mockExportProject.mock.calls[0];

			expect(fileName).toBe('project-runtime-ready.json');

			const exportedProject = JSON.parse(exportedJson);
			expect(exportedProject.compiledModules).toEqual({ mod: {} });
			expect(exportedProject.memorySnapshot).toBeUndefined();
		});

		it('should omit memory snapshot when none is available', async () => {
			mockState.compiler.allocatedMemorySize = 0;

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportRuntimeReadyProjectCall = onCalls.find(call => call[0] === 'exportRuntimeReadyProject');
			const exportRuntimeReadyProjectCallback = exportRuntimeReadyProjectCall![1];

			await exportRuntimeReadyProjectCallback();

			expect(mockExportProject).toHaveBeenCalledTimes(1);
			const [exportedJson] = mockExportProject.mock.calls[0];
			const exportedProject = JSON.parse(exportedJson);
			expect(exportedProject.memorySnapshot).toBeUndefined();
		});

		it('should handle runtime-ready export errors gracefully', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

			mockState.compiler.compiledModules = { mod: {} };
			mockState.callbacks.exportProject = vi.fn().mockRejectedValue(new Error('Export failed'));

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const exportRuntimeReadyProjectCall = onCalls.find(call => call[0] === 'exportRuntimeReadyProject');
			const exportRuntimeReadyProjectCallback = exportRuntimeReadyProjectCall![1];

			await exportRuntimeReadyProjectCallback();

			expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save runtime-ready project to file:', expect.any(Error));

			consoleErrorSpy.mockRestore();
		});
	});

	describe('saveSession', () => {
		it('should save session when saveSession callback is provided', async () => {
			const mockSaveSession = vi.fn().mockResolvedValue(undefined);
			const mockGetStorageQuota = vi.fn().mockResolvedValue({ usedBytes: 1024, totalBytes: 10240 });
			mockState.callbacks.saveSession = mockSaveSession;
			mockState.callbacks.getStorageQuota = mockGetStorageQuota;

			projectExport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const saveSessionCall = onCalls.find(call => call[0] === 'saveSession');
			const saveSessionCallback = saveSessionCall![1];

			await saveSessionCallback();

			expect(mockSaveSession).toHaveBeenCalled();
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
			mockState.callbacks.getStorageQuota = mockGetStorageQuota;

			const subscribeSpy = vi.spyOn(store, 'subscribe');

			projectExport(store, mockEvents);

			// Find the code change callback
			const codeChangeCall = subscribeSpy.mock.calls.find(call => call[0] === 'graphicHelper.selectedCodeBlock.code');
			expect(codeChangeCall).toBeDefined();
			const programmaticChangeCall = subscribeSpy.mock.calls.find(
				call => call[0] === 'graphicHelper.selectedCodeBlockForProgrammaticEdit.code'
			);
			expect(programmaticChangeCall).toBeDefined();

			const codeChangeCallback = codeChangeCall![1];
			await codeChangeCallback();

			expect(mockSaveSession).toHaveBeenCalled();

			subscribeSpy.mockRestore();
		});
	});
});
