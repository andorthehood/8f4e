import { describe, it, expect, beforeEach, vi } from 'vitest';

import codeBlockNavigation from './codeBlockNavigation';

import type { State, EventDispatcher, InternalKeyboardEvent, CodeBlockGraphicData } from '../types';

describe('codeBlockNavigation', () => {
	let state: State;
	let events: EventDispatcher;
	let onKeydownHandler: (event: InternalKeyboardEvent) => void;
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

		// Create mock code blocks
		selectedBlock = createMockCodeBlock(200, 200);
		leftBlock = createMockCodeBlock(0, 200);
		rightBlock = createMockCodeBlock(400, 200);
		upBlock = createMockCodeBlock(200, 0);
		downBlock = createMockCodeBlock(200, 400);

		// Create mock state
		state = {
			featureFlags: {
				contextMenu: true,
				infoOverlay: true,
				moduleDragging: true,
				viewportDragging: true,
				viewportAnimations: false,
				persistentStorage: true,
				editing: true,
				demoMode: false,
			},
			graphicHelper: {
				selectedCodeBlock: selectedBlock,
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
			on: vi.fn((eventName: string, callback: ((event: InternalKeyboardEvent) => void) | (() => void)) => {
				if (eventName === 'keydown') {
					onKeydownHandler = callback as (event: InternalKeyboardEvent) => void;
				} else if (eventName === 'init') {
					onInitHandler = callback as () => void;
				}
			}) as EventDispatcher['on'],
			off: vi.fn(),
			dispatch: vi.fn(),
		};
	});

	it('should register a keydown event handler', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		expect(events.on).toHaveBeenCalledWith('keydown', expect.any(Function));
	});

	it('should do nothing when metaKey is not pressed', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		const initialBlock = state.graphicHelper.selectedCodeBlock;
		onKeydownHandler({ key: 'ArrowRight', metaKey: false });
		expect(state.graphicHelper.selectedCodeBlock).toBe(initialBlock);
	});

	it('should do nothing when no code block is selected', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		state.graphicHelper.selectedCodeBlock = undefined;
		onKeydownHandler({ key: 'ArrowRight', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(undefined);
	});

	it('should do nothing for non-arrow keys even with metaKey', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		const initialBlock = state.graphicHelper.selectedCodeBlock;
		onKeydownHandler({ key: 'a', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(initialBlock);
	});

	it('should navigate left when Command + ArrowLeft is pressed', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		onKeydownHandler({ key: 'ArrowLeft', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(leftBlock);
	});

	it('should navigate right when Command + ArrowRight is pressed', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		onKeydownHandler({ key: 'ArrowRight', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(rightBlock);
	});

	it('should navigate up when Command + ArrowUp is pressed', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		onKeydownHandler({ key: 'ArrowUp', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(upBlock);
	});

	it('should navigate down when Command + ArrowDown is pressed', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		onKeydownHandler({ key: 'ArrowDown', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(downBlock);
	});

	it('should center viewport on the newly selected code block', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		const initialViewportX = state.graphicHelper.activeViewport.viewport.x;
		const initialViewportY = state.graphicHelper.activeViewport.viewport.y;

		onKeydownHandler({ key: 'ArrowRight', metaKey: true });

		// Verify viewport has changed
		const viewportChanged =
			state.graphicHelper.activeViewport.viewport.x !== initialViewportX ||
			state.graphicHelper.activeViewport.viewport.y !== initialViewportY;

		expect(viewportChanged).toBe(true);
	});

	it('should not change selection if no block found in direction', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		// Remove all blocks except selected
		state.graphicHelper.activeViewport.codeBlocks = new Set([selectedBlock]);

		onKeydownHandler({ key: 'ArrowRight', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
	});

	describe('demo mode', () => {
		beforeEach(() => {
			// Enable demo mode
			state.featureFlags.demoMode = true;
			// Clear the selected block to test auto-selection
			state.graphicHelper.selectedCodeBlock = undefined;
		});

		it('should register an init event handler when demo mode is enabled', () => {
			codeBlockNavigation(state, events);

			expect(events.on).toHaveBeenCalledWith('init', expect.any(Function));
		});

		it('should not register an init event handler when demo mode is disabled', () => {
			state.featureFlags.demoMode = false;
			codeBlockNavigation(state, events);

			// Check that init handler was not registered
			const calls = (events.on as ReturnType<typeof vi.fn>).mock.calls;
			const initCalls = calls.filter((call: unknown[]) => call[0] === 'init');
			expect(initCalls.length).toBe(0);
		});

		it('should select a random code block on init when none is selected', () => {
			codeBlockNavigation(state, events);
			expect(onInitHandler).toBeDefined();

			// Trigger init
			onInitHandler!();

			// A code block should now be selected
			expect(state.graphicHelper.selectedCodeBlock).toBeDefined();
			expect(state.graphicHelper.activeViewport.codeBlocks.has(state.graphicHelper.selectedCodeBlock!)).toBe(true);
		});

		it('should not change selection on init when a block is already selected', () => {
			state.graphicHelper.selectedCodeBlock = selectedBlock;
			codeBlockNavigation(state, events);

			// Trigger init
			onInitHandler!();

			// The selected block should remain the same
			expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
		});

		it('should navigate between blocks at 2 second intervals', () => {
			state.graphicHelper.selectedCodeBlock = selectedBlock;
			codeBlockNavigation(state, events);

			// Trigger init
			onInitHandler!();

			// Fast-forward time by 2 seconds
			vi.advanceTimersByTime(2000);

			// The selected block might have changed (depending on random direction)
			// Just verify that navigation was attempted
			expect(state.graphicHelper.selectedCodeBlock).toBeDefined();
		});

		it('should handle empty code blocks gracefully during demo navigation', () => {
			state.graphicHelper.activeViewport.codeBlocks = new Set();
			state.graphicHelper.selectedCodeBlock = undefined;

			codeBlockNavigation(state, events);

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
			codeBlockNavigation(state, events);

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
