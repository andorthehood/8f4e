import { describe, it, expect, beforeEach, vi } from 'vitest';

import codeBlockNavigation from './codeBlockNavigation';

import { createMockCodeBlock, createMockState } from '../pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../pureHelpers/testingUtils/vitestTestUtils';

import type { InternalKeyboardEvent, CodeBlockGraphicData } from '../types';

describe('codeBlockNavigation', () => {
	let state: ReturnType<typeof createMockState>;
	let events: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let onKeydownHandler: (event: InternalKeyboardEvent) => void;
	let selectedBlock: CodeBlockGraphicData;
	let leftBlock: CodeBlockGraphicData;
	let rightBlock: CodeBlockGraphicData;
	let upBlock: CodeBlockGraphicData;
	let downBlock: CodeBlockGraphicData;

	beforeEach(() => {
		// Clear all timers before each test
		vi.clearAllTimers();
		vi.useFakeTimers();

		// Create mock code blocks using shared utility
		selectedBlock = createMockCodeBlock({ x: 200, y: 200 });
		leftBlock = createMockCodeBlock({ x: 0, y: 200 });
		rightBlock = createMockCodeBlock({ x: 400, y: 200 });
		upBlock = createMockCodeBlock({ x: 200, y: 0 });
		downBlock = createMockCodeBlock({ x: 200, y: 400 });

		// Create mock state using shared utility
		state = createMockState({
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
				codeBlocks: [selectedBlock, leftBlock, rightBlock, upBlock, downBlock],
				viewport: { x: 0, y: 0, width: 800, height: 600, vGrid: 8, hGrid: 16 },
			},
		});

		// Create mock event dispatcher using shared utility
		events = createMockEventDispatcherWithVitest();
		(events.on as ReturnType<typeof vi.fn>).mockImplementation(
			(eventName: string, callback: ((event: InternalKeyboardEvent) => void) | (() => void)) => {
				if (eventName === 'keydown') {
					onKeydownHandler = callback as (event: InternalKeyboardEvent) => void;
				}
			}
		);
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

		const initialViewportX = state.graphicHelper.viewport.x;
		const initialViewportY = state.graphicHelper.viewport.y;

		onKeydownHandler({ key: 'ArrowRight', metaKey: true });

		// Verify viewport has changed
		const viewportChanged =
			state.graphicHelper.viewport.x !== initialViewportX || state.graphicHelper.viewport.y !== initialViewportY;

		expect(viewportChanged).toBe(true);
	});

	it('should not change selection if no block found in direction', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		// Remove all blocks except selected
		state.graphicHelper.codeBlocks = [selectedBlock];

		onKeydownHandler({ key: 'ArrowRight', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
	});
});
