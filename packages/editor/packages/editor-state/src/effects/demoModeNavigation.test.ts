import { describe, it, expect, beforeEach, vi } from 'vitest';

import demoModeNavigation from './demoModeNavigation';
import { navigateToCodeBlockInDirection } from './codeBlockNavigation';

import type { State, EventDispatcher, CodeBlockGraphicData } from '../types';

describe('demoModeNavigation', () => {
	let state: State;
	let events: EventDispatcher;
	let onInitHandler: (() => void) | undefined;
	let selectedBlock: CodeBlockGraphicData;
	let leftBlock: CodeBlockGraphicData;
	let rightBlock: CodeBlockGraphicData;
	let upBlock: CodeBlockGraphicData;
	let downBlock: CodeBlockGraphicData;
	let navigateSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Clear all timers before each test
		vi.clearAllTimers();
		vi.useFakeTimers();

		// Create mock code blocks
		selectedBlock = createMockCodeBlock(200, 200);
		leftBlock = createMockCodeBlock(0, 200);
		rightBlock = createMockCodeBlock(400, 200);
		upBlock = createMockCodeBlock(200, 0);
		downBlock = createMockCodeBlock(200, 400);

		// Create mock state with demo mode enabled
		state = {
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
				activeViewport: {
					codeBlocks: new Set([selectedBlock, leftBlock, rightBlock, upBlock, downBlock]),
					viewport: { x: 0, y: 0 },
				},
				globalViewport: { width: 800, height: 600, vGrid: 8, hGrid: 16 },
			},
		} as unknown as State;

		// Reset handlers
		onInitHandler = undefined;

		// Create mock event dispatcher
		events = {
			on: vi.fn((eventName: string, callback: () => void) => {
				if (eventName === 'init') {
					onInitHandler = callback;
				}
			}) as EventDispatcher['on'],
			off: vi.fn(),
			dispatch: vi.fn(),
		};

		// Create a spy for the navigate function
		navigateSpy = vi.fn(navigateToCodeBlockInDirection);
	});

	it('should register an init event handler when demo mode is enabled', () => {
		demoModeNavigation(state, events, navigateSpy);

		expect(events.on).toHaveBeenCalledWith('init', expect.any(Function));
	});

	it('should not register an init event handler when demo mode is disabled', () => {
		state.featureFlags.demoMode = false;
		demoModeNavigation(state, events, navigateSpy);

		// Check that init handler was not registered
		const calls = (events.on as ReturnType<typeof vi.fn>).mock.calls;
		const initCalls = calls.filter((call: unknown[]) => call[0] === 'init');
		expect(initCalls.length).toBe(0);
	});

	it('should select a random code block on init when none is selected', () => {
		demoModeNavigation(state, events, navigateSpy);
		expect(onInitHandler).toBeDefined();

		// Trigger init
		onInitHandler!();

		// A code block should now be selected
		expect(state.graphicHelper.selectedCodeBlock).toBeDefined();
		expect(state.graphicHelper.activeViewport.codeBlocks.has(state.graphicHelper.selectedCodeBlock!)).toBe(true);
	});

	it('should not change selection on init when a block is already selected', () => {
		state.graphicHelper.selectedCodeBlock = selectedBlock;
		demoModeNavigation(state, events, navigateSpy);

		// Trigger init
		onInitHandler!();

		// The selected block should remain the same
		expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
	});

	it('should navigate between blocks at 2 second intervals', () => {
		state.graphicHelper.selectedCodeBlock = selectedBlock;
		demoModeNavigation(state, events, navigateSpy);

		// Trigger init
		onInitHandler!();

		// Fast-forward time by 2 seconds
		vi.advanceTimersByTime(2000);

		// Navigation should have been called
		expect(navigateSpy).toHaveBeenCalled();
	});

	it('should handle empty code blocks gracefully during demo navigation', () => {
		state.graphicHelper.activeViewport.codeBlocks = new Set();
		state.graphicHelper.selectedCodeBlock = undefined;

		demoModeNavigation(state, events, navigateSpy);

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
		demoModeNavigation(state, events, navigateSpy);

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

/**
 * Helper to create a mock code block for testing
 */
function createMockCodeBlock(x: number, y: number): CodeBlockGraphicData {
	return {
		x,
		y,
		width: 100,
		height: 100,
		offsetX: 0,
		offsetY: 0,
		code: [],
		trimmedCode: [],
		codeColors: [],
		codeToRender: [],
		cursor: { col: 0, row: 0, x: x + 50, y: 50 }, // Cursor Y is relative to block (height/2)
		id: `block-${x}-${y}`,
		gaps: new Map(),
		gridX: 0,
		gridY: 0,
		isOpen: true,
		padLength: 1,
		minGridWidth: 32,
		viewport: { x: 0, y: 0 },
		codeBlocks: new Set(),
		lastUpdated: Date.now(),
		extras: {
			inputs: new Map(),
			outputs: new Map(),
			debuggers: new Map(),
			switches: new Map(),
			buttons: new Map(),
			pianoKeyboards: new Map(),
			bufferPlotters: new Map(),
			errorMessages: new Map(),
		},
	} as CodeBlockGraphicData;
}
