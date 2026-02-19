import { describe, it, expect, beforeEach, vi } from 'vitest';

import codeBlockNavigation, { goHome, jumpToCodeBlock } from './effect';

import type { NavigateCodeBlockEvent, CodeBlockGraphicData } from '~/types';

import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

interface JumpToFavoriteCodeBlockEvent {
	creationIndex: number;
	id: string;
}

describe('codeBlockNavigation', () => {
	let state: ReturnType<typeof createMockState>;
	let events: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let onNavigateCodeBlockHandler: (event: NavigateCodeBlockEvent) => void;
	let onJumpToFavoriteCodeBlockHandler: (event: JumpToFavoriteCodeBlockEvent) => void;
	let onGoHomeHandler: () => void;
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
		selectedBlock = createMockCodeBlock({ x: 200, y: 200, creationIndex: 0, id: 'selected' });
		leftBlock = createMockCodeBlock({ x: 0, y: 200, creationIndex: 1, id: 'left' });
		rightBlock = createMockCodeBlock({ x: 400, y: 200, creationIndex: 2, id: 'right' });
		upBlock = createMockCodeBlock({ x: 200, y: 0, creationIndex: 3, id: 'up' });
		downBlock = createMockCodeBlock({ x: 200, y: 400, creationIndex: 4, id: 'down' });

		// Create mock state using shared utility
		state = createMockState({
			featureFlags: {
				contextMenu: true,
				infoOverlay: true,
				moduleDragging: true,
				viewportDragging: true,
				viewportAnimations: false,
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
			(
				eventName: string,
				callback: ((event: NavigateCodeBlockEvent | JumpToFavoriteCodeBlockEvent) => void) | (() => void)
			) => {
				if (eventName === 'navigateCodeBlock') {
					onNavigateCodeBlockHandler = callback as (event: NavigateCodeBlockEvent) => void;
				} else if (eventName === 'jumpToFavoriteCodeBlock') {
					onJumpToFavoriteCodeBlockHandler = callback as (event: JumpToFavoriteCodeBlockEvent) => void;
				} else if (eventName === 'goHome') {
					onGoHomeHandler = callback as () => void;
				}
			}
		);
	});

	it('should register a navigateCodeBlock event handler', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		expect(events.on).toHaveBeenCalledWith('navigateCodeBlock', expect.any(Function));
	});

	it('should register a jumpToFavoriteCodeBlock event handler', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		expect(events.on).toHaveBeenCalledWith('jumpToFavoriteCodeBlock', expect.any(Function));
	});

	it('should register a goHome event handler', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		expect(events.on).toHaveBeenCalledWith('goHome', expect.any(Function));
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

		const initialViewportX = state.viewport.x;
		const initialViewportY = state.viewport.y;

		onNavigateCodeBlockHandler({ direction: 'right' });

		// Verify viewport has changed
		const viewportChanged = state.viewport.x !== initialViewportX || state.viewport.y !== initialViewportY;

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

	describe('jumpToCodeBlock', () => {
		it('should jump to code block by creationIndex', () => {
			const result = jumpToCodeBlock(state, 2, 'wrong-id');
			expect(result).toBe(true);
			expect(state.graphicHelper.selectedCodeBlock).toBe(rightBlock);
		});

		it('should jump to code block by id when creationIndex does not match', () => {
			const result = jumpToCodeBlock(state, 999, 'left');
			expect(result).toBe(true);
			expect(state.graphicHelper.selectedCodeBlock).toBe(leftBlock);
		});

		it('should return false when neither creationIndex nor id matches', () => {
			const result = jumpToCodeBlock(state, 999, 'nonexistent');
			expect(result).toBe(false);
			// selectedCodeBlock should remain unchanged
			expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
		});

		it('should prefer creationIndex over id when both could match', () => {
			// Set up a scenario where id matches one block but creationIndex matches another
			const result = jumpToCodeBlock(state, 3, 'left');
			// Should select upBlock (creationIndex=3) not leftBlock (id='left')
			expect(result).toBe(true);
			expect(state.graphicHelper.selectedCodeBlock).toBe(upBlock);
		});

		it('should center viewport on the jumped-to code block', () => {
			const initialViewportX = state.viewport.x;
			const initialViewportY = state.viewport.y;

			jumpToCodeBlock(state, 4, 'down');

			// Verify viewport has changed
			const viewportChanged = state.viewport.x !== initialViewportX || state.viewport.y !== initialViewportY;
			expect(viewportChanged).toBe(true);
		});
	});

	describe('jumpToFavoriteCodeBlock event', () => {
		it('should jump when jumpToFavoriteCodeBlock event is dispatched', () => {
			// Initialize the effect
			codeBlockNavigation(state, events);

			onJumpToFavoriteCodeBlockHandler({ creationIndex: 2, id: 'right' });
			expect(state.graphicHelper.selectedCodeBlock).toBe(rightBlock);
		});

		it('should handle jumpToFavoriteCodeBlock with non-existent target gracefully', () => {
			// Initialize the effect
			codeBlockNavigation(state, events);

			onJumpToFavoriteCodeBlockHandler({ creationIndex: 999, id: 'nonexistent' });
			// selectedCodeBlock should remain unchanged
			expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
		});
	});

	describe('goHome', () => {
		it('should center viewport on the first home block and select it', () => {
			const firstHome = createMockCodeBlock({ id: 'home-1', x: 100, y: 100, isHome: true });
			const secondHome = createMockCodeBlock({ id: 'home-2', x: 400, y: 400, isHome: true });

			state = createMockState({
				graphicHelper: { codeBlocks: [firstHome, secondHome] },
				viewport: { x: 10, y: 20, width: 200, height: 200, roundedWidth: 200, roundedHeight: 200 },
			});

			goHome(state);

			expect(state.graphicHelper.selectedCodeBlock).toBe(firstHome);
			expect(state.viewport.x).toBe(50);
			expect(state.viewport.y).toBe(50);
		});

		it('should use a disabled home block if it is first', () => {
			const disabledHome = createMockCodeBlock({ id: 'home-disabled', isHome: true, disabled: true });
			const otherHome = createMockCodeBlock({ id: 'home-other', isHome: true });

			state = createMockState({
				graphicHelper: { codeBlocks: [disabledHome, otherHome] },
			});

			goHome(state);

			expect(state.graphicHelper.selectedCodeBlock).toBe(disabledHome);
		});

		it('should center on origin when no home block exists', () => {
			state = createMockState({
				featureFlags: { viewportAnimations: false },
				viewport: { x: 25, y: -10 },
				graphicHelper: { codeBlocks: [selectedBlock], selectedCodeBlock: selectedBlock },
			});

			goHome(state);

			expect(state.viewport.x).toBe(0);
			expect(state.viewport.y).toBe(0);
			expect(state.featureFlags.viewportAnimations).toBe(false);
			expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
		});

		it('should respond to goHome event', () => {
			const homeBlock = createMockCodeBlock({ id: 'home-event', isHome: true, x: 160, y: 80 });
			state.graphicHelper.codeBlocks = [homeBlock, ...state.graphicHelper.codeBlocks];

			codeBlockNavigation(state, events);

			onGoHomeHandler();

			expect(state.graphicHelper.selectedCodeBlock).toBe(homeBlock);
		});
	});
});
