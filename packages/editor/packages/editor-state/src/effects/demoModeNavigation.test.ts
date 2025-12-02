import { describe, it, expect, beforeEach, vi } from 'vitest';

import demoModeNavigation from './demoModeNavigation';
import * as codeBlockNavigationModule from './codeBlockNavigation';

import { createMockCodeBlock, createMockState } from '../helpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../helpers/testingUtils/vitestTestUtils';

import type { CodeBlockGraphicData } from '../types';

// Mock the navigateToCodeBlockInDirection function
vi.mock('./codeBlockNavigation', () => ({
	navigateToCodeBlockInDirection: vi.fn(() => true),
}));

describe('demoModeNavigation', () => {
	let state: ReturnType<typeof createMockState>;
	let events: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let onInitHandler: (() => void) | undefined;
	let selectedBlock: CodeBlockGraphicData;
	let leftBlock: CodeBlockGraphicData;
	let rightBlock: CodeBlockGraphicData;
	let upBlock: CodeBlockGraphicData;
	let downBlock: CodeBlockGraphicData;

	beforeEach(() => {
		// Clear all timers before each test
		vi.clearAllTimers();
		vi.useFakeTimers();

		// Clear mock calls
		vi.clearAllMocks();

		// Create mock code blocks using shared utility
		selectedBlock = createMockCodeBlock({ x: 200, y: 200 });
		leftBlock = createMockCodeBlock({ x: 0, y: 200 });
		rightBlock = createMockCodeBlock({ x: 400, y: 200 });
		upBlock = createMockCodeBlock({ x: 200, y: 0 });
		downBlock = createMockCodeBlock({ x: 200, y: 400 });

		// Create mock state with demo mode enabled using shared utility
		state = createMockState({
			featureFlags: {
				contextMenu: true,
				infoOverlay: true,
				moduleDragging: true,
				viewportDragging: true,
				viewportAnimations: false,
				persistentStorage: true,
				editing: true,
				demoMode: true,
			},
			graphicHelper: {
				selectedCodeBlock: undefined,
				codeBlocks: new Set([selectedBlock, leftBlock, rightBlock, upBlock, downBlock]),
				viewport: { x: 0, y: 0, width: 800, height: 600, vGrid: 8, hGrid: 16 },
			},
		});

		// Reset handlers
		onInitHandler = undefined;

		// Create mock event dispatcher using shared utility
		events = createMockEventDispatcherWithVitest();
		(events.on as ReturnType<typeof vi.fn>).mockImplementation((eventName: string, callback: () => void) => {
			if (eventName === 'init') {
				onInitHandler = callback;
			}
		});
	});

	it('should register an init event handler when demo mode is enabled', () => {
		demoModeNavigation(state, events);

		expect(events.on).toHaveBeenCalledWith('init', expect.any(Function));
	});

	it('should not register an init event handler when demo mode is disabled', () => {
		state.featureFlags.demoMode = false;
		demoModeNavigation(state, events);

		// Check that init handler was not registered
		const calls = (events.on as ReturnType<typeof vi.fn>).mock.calls;
		const initCalls = calls.filter((call: unknown[]) => call[0] === 'init');
		expect(initCalls.length).toBe(0);
	});

	it('should select a random code block on init when none is selected', () => {
		demoModeNavigation(state, events);
		expect(onInitHandler).toBeDefined();

		// Trigger init
		onInitHandler!();

		// A code block should now be selected
		expect(state.graphicHelper.selectedCodeBlock).toBeDefined();
		expect(state.graphicHelper.codeBlocks.has(state.graphicHelper.selectedCodeBlock!)).toBe(true);
	});

	it('should not change selection on init when a block is already selected', () => {
		state.graphicHelper.selectedCodeBlock = selectedBlock;
		demoModeNavigation(state, events);

		// Trigger init
		onInitHandler!();

		// The selected block should remain the same
		expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
	});

	it('should navigate between blocks at 2 second intervals', () => {
		state.graphicHelper.selectedCodeBlock = selectedBlock;
		demoModeNavigation(state, events);

		// Trigger init
		onInitHandler!();

		// Fast-forward time by 2 seconds
		vi.advanceTimersByTime(2000);

		// Navigation should have been called
		expect(codeBlockNavigationModule.navigateToCodeBlockInDirection).toHaveBeenCalled();
	});

	it('should handle empty code blocks gracefully during demo navigation', () => {
		state.graphicHelper.codeBlocks = new Set();
		state.graphicHelper.selectedCodeBlock = undefined;

		demoModeNavigation(state, events);

		// Trigger init
		onInitHandler!();

		// Should not error and should not have selected anything
		expect(state.graphicHelper.selectedCodeBlock).toBeUndefined();

		// Fast-forward time by 2 seconds
		vi.advanceTimersByTime(2000);

		// Should still not error
		expect(state.graphicHelper.selectedCodeBlock).toBeUndefined();
	});

	it('should clear previous interval when init is called multiple times', () => {
		demoModeNavigation(state, events);

		// First init
		onInitHandler!();

		// Spy on clearInterval
		const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

		// Second init
		onInitHandler!();

		// clearInterval should have been called
		expect(clearIntervalSpy).toHaveBeenCalled();
	});
});
