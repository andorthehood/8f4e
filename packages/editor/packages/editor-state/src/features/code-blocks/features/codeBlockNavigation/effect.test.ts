import { describe, it, expect, beforeEach, vi } from 'vitest';

import codeBlockNavigation from './effect';

import { createMockCodeBlock, createMockState } from '../../../../pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../../../../pureHelpers/testingUtils/vitestTestUtils';

import type { NavigateCodeBlockEvent, CodeBlockGraphicData } from '../../../../types';

describe('codeBlockNavigation', () => {
	let state: ReturnType<typeof createMockState>;
	let events: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let onNavigateCodeBlockHandler: (event: NavigateCodeBlockEvent) => void;
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
			(eventName: string, callback: ((event: NavigateCodeBlockEvent) => void) | (() => void)) => {
				if (eventName === 'navigateCodeBlock') {
					onNavigateCodeBlockHandler = callback as (event: NavigateCodeBlockEvent) => void;
				}
			}
		);
	});

	it('should register a navigateCodeBlock event handler', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		expect(events.on).toHaveBeenCalledWith('navigateCodeBlock', expect.any(Function));
	});

	it('should do nothing when no code block is selected', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		state.graphicHelper.selectedCodeBlock = undefined;
		onNavigateCodeBlockHandler({ direction: 'right' });
		expect(state.graphicHelper.selectedCodeBlock).toBe(undefined);
	});

	it('should navigate left when navigateCodeBlock event with left direction is dispatched', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		onNavigateCodeBlockHandler({ direction: 'left' });
		expect(state.graphicHelper.selectedCodeBlock).toBe(leftBlock);
	});

	it('should navigate right when navigateCodeBlock event with right direction is dispatched', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		onNavigateCodeBlockHandler({ direction: 'right' });
		expect(state.graphicHelper.selectedCodeBlock).toBe(rightBlock);
	});

	it('should navigate up when navigateCodeBlock event with up direction is dispatched', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		onNavigateCodeBlockHandler({ direction: 'up' });
		expect(state.graphicHelper.selectedCodeBlock).toBe(upBlock);
	});

	it('should navigate down when navigateCodeBlock event with down direction is dispatched', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		onNavigateCodeBlockHandler({ direction: 'down' });
		expect(state.graphicHelper.selectedCodeBlock).toBe(downBlock);
	});

	it('should center viewport on the newly selected code block', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		const initialViewportX = state.graphicHelper.viewport.x;
		const initialViewportY = state.graphicHelper.viewport.y;

		onNavigateCodeBlockHandler({ direction: 'right' });

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

		onNavigateCodeBlockHandler({ direction: 'right' });
		expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
	});
});
