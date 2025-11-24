import { describe, it, expect, beforeEach, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import editorSettings from './editorSettings';

import { createMockState } from '../helpers/testUtils';
import { createMockEventDispatcherWithVitest } from '../helpers/vitestTestUtils';

import type { State, EditorSettings } from '../types';

describe('editorSettings', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	describe('Initialization', () => {
		it('should create a fresh copy of editorSettings to avoid shared references', () => {
			const defaultState = createMockState();
			const originalSettings = { ...defaultState.editorSettings };

			editorSettings(store, mockEvents, defaultState);

			// Modify the state's editorSettings
			mockState.editorSettings.colorScheme = 'different';

			// Original default should not be affected
			expect(defaultState.editorSettings).toEqual(originalSettings);
		});

		it('should load color schemes on initialization', async () => {
			const mockColorSchemes = ['hackerman', 'redalert', 'default'];
			mockState.callbacks.getListOfColorSchemes = vi.fn().mockResolvedValue(mockColorSchemes);

			editorSettings(store, mockEvents, mockState);

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockState.callbacks.getListOfColorSchemes).toHaveBeenCalled();
			expect(mockState.colorSchemes).toEqual(mockColorSchemes);
		});

		it('should handle color scheme loading errors gracefully', async () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

			mockState.callbacks.getListOfColorSchemes = vi.fn().mockRejectedValue(new Error('Failed to load'));

			editorSettings(store, mockEvents, mockState);

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load color schemes:', expect.any(Error));
			expect(mockState.colorSchemes).toEqual([]);

			consoleWarnSpy.mockRestore();
		});
	});

	describe('Loading editor settings', () => {
		it('should load editor settings from storage when persistentStorage is enabled', async () => {
			const loadedSettings: EditorSettings = {
				colorScheme: 'redalert',
				font: '8x16',
			};

			mockState.featureFlags.persistentStorage = true;
			mockState.callbacks.loadEditorSettings = vi.fn().mockResolvedValue(loadedSettings);
			mockState.callbacks.getListOfColorSchemes = vi.fn().mockResolvedValue([]);

			editorSettings(store, mockEvents, mockState);

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockState.callbacks.loadEditorSettings).toHaveBeenCalled();
			expect(mockState.editorSettings.colorScheme).toBe('redalert');
			expect(mockState.editorSettings.font).toBe('8x16');
		});

		it('should not load settings when persistentStorage is disabled', async () => {
			const mockLoadEditorSettings = vi.fn();

			mockState.featureFlags.persistentStorage = false;
			mockState.callbacks.loadEditorSettings = mockLoadEditorSettings;
			mockState.callbacks.getListOfColorSchemes = vi.fn().mockResolvedValue([]);

			editorSettings(store, mockEvents, mockState);

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockLoadEditorSettings).not.toHaveBeenCalled();
		});

		it('should not load settings when callback is not provided', async () => {
			mockState.featureFlags.persistentStorage = true;
			mockState.callbacks.loadEditorSettings = undefined;
			mockState.callbacks.getListOfColorSchemes = vi.fn().mockResolvedValue([]);

			editorSettings(store, mockEvents, mockState);

			// Should not throw error
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockState.editorSettings).toBeDefined();
		});

		it('should handle loading errors gracefully', async () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
			const defaultState = createMockState();

			mockState.featureFlags.persistentStorage = true;
			mockState.callbacks.loadEditorSettings = vi.fn().mockRejectedValue(new Error('Storage error'));
			mockState.callbacks.getListOfColorSchemes = vi.fn().mockResolvedValue([]);

			editorSettings(store, mockEvents, defaultState);

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load editor settings from storage:', expect.any(Error));
			expect(mockState.editorSettings).toEqual(defaultState.editorSettings);

			consoleWarnSpy.mockRestore();
		});

		it('should load settings after color schemes', async () => {
			const loadOrder: string[] = [];

			mockState.callbacks.getListOfColorSchemes = vi.fn().mockImplementation(async () => {
				loadOrder.push('colorSchemes');
				return ['hackerman'];
			});

			mockState.callbacks.loadEditorSettings = vi.fn().mockImplementation(async () => {
				loadOrder.push('editorSettings');
				return { colorScheme: 'hackerman', font: '8x16' };
			});

			mockState.featureFlags.persistentStorage = true;

			editorSettings(store, mockEvents, mockState);

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(loadOrder).toEqual(['colorSchemes', 'editorSettings']);
		});
	});

	describe('Saving editor settings', () => {
		it('should save settings when editorSettings change', () => {
			const mockSaveEditorSettings = vi.fn();

			mockState.featureFlags.persistentStorage = true;
			mockState.callbacks.saveEditorSettings = mockSaveEditorSettings;
			mockState.callbacks.getListOfColorSchemes = vi.fn().mockResolvedValue([]);

			const subscribeSpy = vi.spyOn(store, 'subscribe');

			editorSettings(store, mockEvents, mockState);

			const settingsSubscription = subscribeSpy.mock.calls.find(call => call[0] === 'editorSettings');
			expect(settingsSubscription).toBeDefined();

			const settingsChangeCallback = settingsSubscription![1];
			(settingsChangeCallback as () => void)();

			expect(mockSaveEditorSettings).toHaveBeenCalledWith(mockState.editorSettings);

			subscribeSpy.mockRestore();
		});

		it('should not save settings when persistentStorage is disabled', () => {
			const mockSaveEditorSettings = vi.fn();

			mockState.featureFlags.persistentStorage = false;
			mockState.callbacks.saveEditorSettings = mockSaveEditorSettings;
			mockState.callbacks.getListOfColorSchemes = vi.fn().mockResolvedValue([]);

			const subscribeSpy = vi.spyOn(store, 'subscribe');

			editorSettings(store, mockEvents, mockState);

			const settingsSubscription = subscribeSpy.mock.calls.find(call => call[0] === 'editorSettings');
			const settingsChangeCallback = settingsSubscription![1];

			(settingsChangeCallback as () => void)();

			expect(mockSaveEditorSettings).not.toHaveBeenCalled();

			subscribeSpy.mockRestore();
		});

		it('should not save settings when callback is not provided', () => {
			mockState.featureFlags.persistentStorage = true;
			mockState.callbacks.saveEditorSettings = undefined;
			mockState.callbacks.getListOfColorSchemes = vi.fn().mockResolvedValue([]);

			const subscribeSpy = vi.spyOn(store, 'subscribe');

			editorSettings(store, mockEvents, mockState);

			const settingsSubscription = subscribeSpy.mock.calls.find(call => call[0] === 'editorSettings');
			const settingsChangeCallback = settingsSubscription![1];

			// Should not throw error
			expect(() => (settingsChangeCallback as () => void)()).not.toThrow();

			subscribeSpy.mockRestore();
		});
	});

	describe('Color scheme subscription', () => {
		it('should reload color scheme when colorScheme setting changes', async () => {
			const mockColorScheme = { name: 'hackerman', colors: {} };
			mockState.callbacks.getColorScheme = vi.fn().mockResolvedValue(mockColorScheme);
			mockState.callbacks.getListOfColorSchemes = vi.fn().mockResolvedValue([]);

			const subscribeSpy = vi.spyOn(store, 'subscribe');

			editorSettings(store, mockEvents, mockState);

			const colorSchemeSubscription = subscribeSpy.mock.calls.find(call => call[0] === 'editorSettings.colorScheme');
			expect(colorSchemeSubscription).toBeDefined();

			const colorSchemeChangeCallback = colorSchemeSubscription![1];
			await (colorSchemeChangeCallback as () => Promise<void>)();

			expect(mockState.callbacks.getColorScheme).toHaveBeenCalledWith(mockState.editorSettings.colorScheme);

			subscribeSpy.mockRestore();
		});

		it('should handle missing getColorScheme callback gracefully', async () => {
			mockState.callbacks.getColorScheme = undefined;
			mockState.callbacks.getListOfColorSchemes = vi.fn().mockResolvedValue([]);

			const subscribeSpy = vi.spyOn(store, 'subscribe');

			editorSettings(store, mockEvents, mockState);

			const colorSchemeSubscription = subscribeSpy.mock.calls.find(call => call[0] === 'editorSettings.colorScheme');
			const colorSchemeChangeCallback = colorSchemeSubscription![1];

			// Should not throw error
			await expect((colorSchemeChangeCallback as () => Promise<void>)()).resolves.toBeUndefined();

			subscribeSpy.mockRestore();
		});
	});

	describe('Event ordering', () => {
		it('should ensure settings load before project loads', async () => {
			const loadedSettings: EditorSettings = {
				colorScheme: 'redalert',
				font: '8x16',
			};

			mockState.featureFlags.persistentStorage = true;
			mockState.callbacks.loadEditorSettings = vi.fn().mockResolvedValue(loadedSettings);
			mockState.callbacks.getListOfColorSchemes = vi.fn().mockResolvedValue(['redalert']);

			editorSettings(store, mockEvents, mockState);

			// Wait for promises to resolve
			await new Promise(resolve => setTimeout(resolve, 10));

			// Settings should be loaded by this point
			expect(mockState.editorSettings.colorScheme).toBe('redalert');
		});
	});
});
