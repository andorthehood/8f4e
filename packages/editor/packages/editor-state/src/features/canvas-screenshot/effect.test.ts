import { describe, expect, it, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import canvasScreenshot from './effect';

import type { State } from '@8f4e/editor-state-types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('canvasScreenshot', () => {
	it('registers the screenshot export event handler', () => {
		const state = createMockState();
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		canvasScreenshot(store, events);

		const onCalls = (events.on as unknown as MockInstance).mock.calls;
		expect(onCalls.find(call => call[0] === 'exportCanvasScreenshot')).toBeDefined();
	});

	it('temporarily disables screenshot-only overlay features while exporting', async () => {
		let state: State;
		const exportCanvasScreenshot = vi.fn(async () => {
			expect(state.featureFlags.modeOverlay).toBe(false);
			expect(state.featureFlags.offscreenBlockArrows).toBe(false);
		});
		state = createMockState({
			callbacks: { exportCanvasScreenshot },
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		canvasScreenshot(store, events);

		const onCalls = (events.on as unknown as MockInstance).mock.calls;
		const exportCanvasScreenshotCallback = onCalls.find(call => call[0] === 'exportCanvasScreenshot')![1];

		await exportCanvasScreenshotCallback();

		expect(exportCanvasScreenshot).toHaveBeenCalledWith('project.png');
		expect(state.featureFlags.modeOverlay).toBe(true);
		expect(state.featureFlags.offscreenBlockArrows).toBe(true);
	});

	it('uses custom exportFileName as base for screenshot export', async () => {
		const exportCanvasScreenshot = vi.fn().mockResolvedValue(undefined);
		const state = createMockState({
			callbacks: { exportCanvasScreenshot },
			editorConfig: { export: { fileName: 'my-project' } },
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		canvasScreenshot(store, events);

		const onCalls = (events.on as unknown as MockInstance).mock.calls;
		const exportCanvasScreenshotCallback = onCalls.find(call => call[0] === 'exportCanvasScreenshot')![1];

		await exportCanvasScreenshotCallback();

		expect(exportCanvasScreenshot).toHaveBeenCalledWith('my-project.png');
	});

	it('restores previous feature flag values after export failure', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const state = createMockState({
			callbacks: { exportCanvasScreenshot: vi.fn().mockRejectedValue(new Error('Export failed')) },
			featureFlags: {
				modeOverlay: true,
				offscreenBlockArrows: false,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		canvasScreenshot(store, events);

		const onCalls = (events.on as unknown as MockInstance).mock.calls;
		const exportCanvasScreenshotCallback = onCalls.find(call => call[0] === 'exportCanvasScreenshot')![1];

		await exportCanvasScreenshotCallback();

		expect(state.featureFlags.modeOverlay).toBe(true);
		expect(state.featureFlags.offscreenBlockArrows).toBe(false);
		expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to export canvas screenshot:', expect.any(Error));

		consoleErrorSpy.mockRestore();
	});

	it('warns when no screenshot export callback is provided', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const state = createMockState({
			callbacks: { exportCanvasScreenshot: undefined },
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		canvasScreenshot(store, events);

		const onCalls = (events.on as unknown as MockInstance).mock.calls;
		const exportCanvasScreenshotCallback = onCalls.find(call => call[0] === 'exportCanvasScreenshot')![1];

		await exportCanvasScreenshotCallback();

		expect(consoleWarnSpy).toHaveBeenCalledWith('No exportCanvasScreenshot callback provided');

		consoleWarnSpy.mockRestore();
	});
});
