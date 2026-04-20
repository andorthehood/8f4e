import { describe, it, expect, beforeEach, vi } from 'vitest';

import codeBlockNavigation, { goHome, jumpToCodeBlock, navigateToCodeBlockInDirection } from './effect';

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
		selectedBlock = createMockCodeBlock({
			x: 200,
			y: 200,
			creationIndex: 0,
			id: 'selected',
		});
		leftBlock = createMockCodeBlock({
			x: 0,
			y: 200,
			creationIndex: 1,
			id: 'left',
		});
		rightBlock = createMockCodeBlock({
			x: 400,
			y: 200,
			creationIndex: 2,
			id: 'right',
		});
		upBlock = createMockCodeBlock({ x: 200, y: 0, creationIndex: 3, id: 'up' });
		downBlock = createMockCodeBlock({
			x: 200,
			y: 400,
			creationIndex: 4,
			id: 'down',
		});

		// Create mock state using shared utility
		state = createMockState({
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

	it('should skip viewport-anchored blocks during directional navigation', () => {
		const anchoredRight = createMockCodeBlock({
			x: 300,
			y: 200,
			creationIndex: 5,
			id: 'anchored-right',
			viewportAnchor: 'top-right',
		});
		state.graphicHelper.codeBlocks = [selectedBlock, anchoredRight, rightBlock];

		codeBlockNavigation(state, events);

		onNavigateCodeBlockHandler({ direction: 'right' });

		expect(state.graphicHelper.selectedCodeBlock).toBe(rightBlock);
	});

	it('should navigate from a viewport-anchored selected block to a world-space block', () => {
		const anchoredSelected = createMockCodeBlock({
			x: 200,
			y: 200,
			creationIndex: 0,
			id: 'anchored-selected',
			viewportAnchor: 'top-left',
		});
		state.graphicHelper.selectedCodeBlock = anchoredSelected;
		state.graphicHelper.codeBlocks = [anchoredSelected, rightBlock];

		codeBlockNavigation(state, events);

		onNavigateCodeBlockHandler({ direction: 'right' });

		expect(state.graphicHelper.selectedCodeBlock).toBe(rightBlock);
	});

	it('should align the target highlighted line during horizontal navigation', () => {
		selectedBlock.code = ['zero', 'one', 'two', 'three'];
		selectedBlock.cursor.row = 2;
		selectedBlock.cursor.col = 3;
		selectedBlock.cursor.y = 2 * state.viewport.hGrid;

		rightBlock.code = ['a', 'bb', 'ccc', 'dddd', 'eeeee'];
		rightBlock.cursor.row = 0;
		rightBlock.cursor.col = 0;

		codeBlockNavigation(state, events);

		onNavigateCodeBlockHandler({ direction: 'right' });

		expect(state.graphicHelper.selectedCodeBlock).toBe(rightBlock);
		expect(rightBlock.cursor.row).toBe(2);
		expect(rightBlock.cursor.col).toBe(3);
		expect(rightBlock.cursor.y).toBe(2 * state.viewport.hGrid);
	});

	it('should navigate up when navigateCodeBlock event with up direction is dispatched', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);
		selectedBlock.cursor.row = 0;
		selectedBlock.cursor.y = 0;

		onNavigateCodeBlockHandler({ direction: 'up' });
		expect(state.graphicHelper.selectedCodeBlock).toBe(upBlock);
	});

	it('should navigate down when navigateCodeBlock event with down direction is dispatched', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);
		selectedBlock.code = ['zero', 'one', 'two', 'three'];
		selectedBlock.cursor.row = 3;
		selectedBlock.cursor.y = 3 * state.viewport.hGrid;

		onNavigateCodeBlockHandler({ direction: 'down' });
		expect(state.graphicHelper.selectedCodeBlock).toBe(downBlock);
	});

	it('should move to the first line of the current block before navigating upward', () => {
		selectedBlock.code = ['zero', 'one', 'two', 'three'];
		selectedBlock.cursor.row = 2;
		selectedBlock.cursor.col = 2;
		selectedBlock.cursor.y = 2 * state.viewport.hGrid;

		const result = navigateToCodeBlockInDirection(state, 'up', events);

		expect(result).toBe(true);
		expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
		expect(selectedBlock.cursor.row).toBe(0);
		expect(selectedBlock.cursor.y).toBe(0);
		expect(state.viewport.y).toBe(selectedBlock.y + selectedBlock.offsetY - state.viewport.height / 2);
		expect(events.dispatch).toHaveBeenCalledWith(
			'viewportChanged',
			expect.objectContaining({
				y: state.viewport.y,
			})
		);
	});

	it('should move to the last line of the current block before navigating downward', () => {
		selectedBlock.code = ['zero', 'one', 'two', 'three'];
		selectedBlock.cursor.row = 1;
		selectedBlock.cursor.col = 1;
		selectedBlock.cursor.y = state.viewport.hGrid;

		const result = navigateToCodeBlockInDirection(state, 'down', events);

		expect(result).toBe(true);
		expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
		expect(selectedBlock.cursor.row).toBe(3);
		expect(selectedBlock.cursor.y).toBe(3 * state.viewport.hGrid);
		expect(state.viewport.y).toBe(
			selectedBlock.y + selectedBlock.offsetY + 3 * state.viewport.hGrid - state.viewport.height / 2
		);
		expect(events.dispatch).toHaveBeenCalledWith(
			'viewportChanged',
			expect.objectContaining({
				y: state.viewport.y,
			})
		);
	});

	it('should select the bottom row of the block above after the current top row is highlighted', () => {
		selectedBlock.code = ['zero', 'one', 'two', 'three'];
		selectedBlock.cursor.row = 0;
		selectedBlock.cursor.col = 2;
		selectedBlock.cursor.y = 0;

		upBlock.code = ['a', 'bb', 'ccc'];
		upBlock.cursor.row = 0;
		upBlock.cursor.col = 0;
		upBlock.cursor.y = 0;

		const result = navigateToCodeBlockInDirection(state, 'up', events);

		expect(result).toBe(true);
		expect(state.graphicHelper.selectedCodeBlock).toBe(upBlock);
		expect(upBlock.cursor.row).toBe(2);
		expect(upBlock.cursor.col).toBe(2);
		expect(upBlock.cursor.y).toBe(2 * state.viewport.hGrid);
	});

	it('should select the top row of the block below after the current bottom row is highlighted', () => {
		selectedBlock.code = ['zero', 'one', 'two', 'three'];
		selectedBlock.cursor.row = 3;
		selectedBlock.cursor.col = 3;
		selectedBlock.cursor.y = 3 * state.viewport.hGrid;

		downBlock.code = ['a', 'bb', 'ccc'];
		downBlock.cursor.row = 2;
		downBlock.cursor.col = 1;
		downBlock.cursor.y = 2 * state.viewport.hGrid;

		const result = navigateToCodeBlockInDirection(state, 'down', events);

		expect(result).toBe(true);
		expect(state.graphicHelper.selectedCodeBlock).toBe(downBlock);
		expect(downBlock.cursor.row).toBe(0);
		expect(downBlock.cursor.col).toBe(1);
		expect(downBlock.cursor.y).toBe(0);
	});

	it('should center viewport on the newly selected highlighted line', () => {
		// Initialize the effect
		codeBlockNavigation(state, events);

		selectedBlock.cursor.y = state.viewport.hGrid;
		rightBlock.cursor.y = 5 * state.viewport.hGrid;

		onNavigateCodeBlockHandler({ direction: 'right' });

		expect(state.viewport.y).toBe(rightBlock.y + rightBlock.offsetY + rightBlock.cursor.y - state.viewport.height / 2);
	});

	it('should animate viewport when navigating between code blocks if animation callbacks are available', () => {
		const frameCallbacks: Array<(time: number) => void> = [];
		state = createMockState({
			callbacks: {
				requestAnimationFrame: vi.fn(callback => {
					frameCallbacks.push(callback);
					return frameCallbacks.length;
				}),
				cancelAnimationFrame: vi.fn(),
			},
			graphicHelper: {
				selectedCodeBlock: selectedBlock,
				codeBlocks: [selectedBlock, leftBlock, rightBlock, upBlock, downBlock],
			},
			viewport: {
				x: 0,
				y: 0,
				width: 800,
				height: 600,
				roundedWidth: 800,
				roundedHeight: 600,
				vGrid: 8,
				hGrid: 16,
			},
		});

		codeBlockNavigation(state, events);

		onNavigateCodeBlockHandler({ direction: 'right' });

		expect(state.graphicHelper.selectedCodeBlock).toBe(rightBlock);
		expect(state.viewportAnimation.active).toBe(true);
		expect(state.viewportAnimation.targetX).toBe(
			rightBlock.x + rightBlock.offsetX + rightBlock.width / 2 - state.viewport.width / 2
		);
		expect(state.viewportAnimation.targetY).toBe(
			rightBlock.y + rightBlock.offsetY + rightBlock.cursor.y - state.viewport.height / 2
		);
		expect(state.viewport.x).toBe(0);
		expect(state.viewport.y).toBe(0);

		frameCallbacks[0](0);
		frameCallbacks[1](state.viewportAnimation.durationMs);

		expect(state.viewport.x).toBe(state.viewportAnimation.targetX);
		expect(state.viewport.y).toBe(state.viewportAnimation.targetY);
		expect(state.viewportAnimation.active).toBe(false);
		expect(events.dispatch).toHaveBeenCalledWith(
			'viewportChanged',
			expect.objectContaining({
				x: state.viewport.x,
				y: state.viewport.y,
			})
		);
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
			const result = jumpToCodeBlock(state, 2, 'wrong-id', events);
			expect(result).toBe(true);
			expect(state.graphicHelper.selectedCodeBlock).toBe(rightBlock);
			expect(events.dispatch).toHaveBeenCalledWith(
				'viewportChanged',
				expect.objectContaining({
					x: state.viewport.x,
					y: state.viewport.y,
				})
			);
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
			downBlock.cursor.y = 3 * state.viewport.hGrid;

			jumpToCodeBlock(state, 4, 'down');

			expect(state.viewport.y).toBe(downBlock.y + downBlock.offsetY + downBlock.cursor.y - state.viewport.height / 2);
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

			onJumpToFavoriteCodeBlockHandler({
				creationIndex: 999,
				id: 'nonexistent',
			});
			// selectedCodeBlock should remain unchanged
			expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
		});
	});

	describe('goHome', () => {
		it('should center viewport on the first home block and select it', () => {
			const firstHome = createMockCodeBlock({
				id: 'home-1',
				x: 100,
				y: 100,
				isHome: true,
				cursorY: 32,
			});
			const secondHome = createMockCodeBlock({
				id: 'home-2',
				x: 400,
				y: 400,
				isHome: true,
			});

			state = createMockState({
				graphicHelper: { codeBlocks: [firstHome, secondHome] },
				viewport: {
					x: 10,
					y: 20,
					width: 200,
					height: 200,
					roundedWidth: 200,
					roundedHeight: 200,
				},
			});

			goHome(state);

			expect(state.graphicHelper.selectedCodeBlock).toBe(firstHome);
			expect(state.viewport.x).toBe(50);
			expect(state.viewport.y).toBe(32);
		});

		it('should dispatch viewportChanged after goHome changes the viewport', () => {
			const homeBlock = createMockCodeBlock({
				id: 'home-dispatch',
				isHome: true,
				x: 100,
				y: 100,
			});
			state = createMockState({
				graphicHelper: { codeBlocks: [homeBlock] },
			});

			goHome(state, events);

			expect(events.dispatch).toHaveBeenCalledWith(
				'viewportChanged',
				expect.objectContaining({
					x: state.viewport.x,
					y: state.viewport.y,
				})
			);
		});

		it('should use a disabled home block if it is first', () => {
			const disabledHome = createMockCodeBlock({
				id: 'home-disabled',
				isHome: true,
				disabled: true,
			});
			const otherHome = createMockCodeBlock({ id: 'home-other', isHome: true });

			state = createMockState({
				graphicHelper: { codeBlocks: [disabledHome, otherHome] },
			});

			goHome(state);

			expect(state.graphicHelper.selectedCodeBlock).toBe(disabledHome);
		});

		it('should center on origin when no home block exists', () => {
			state = createMockState({
				viewport: { x: 25, y: -10 },
				graphicHelper: {
					codeBlocks: [selectedBlock],
					selectedCodeBlock: selectedBlock,
				},
			});

			goHome(state);

			expect(state.viewport.x).toBe(0);
			expect(state.viewport.y).toBe(0);
			expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
		});

		it('should respond to goHome event', () => {
			const homeBlock = createMockCodeBlock({
				id: 'home-event',
				isHome: true,
				x: 160,
				y: 80,
			});
			state.graphicHelper.codeBlocks = [homeBlock, ...state.graphicHelper.codeBlocks];

			codeBlockNavigation(state, events);

			onGoHomeHandler();

			expect(state.graphicHelper.selectedCodeBlock).toBe(homeBlock);
		});
	});
});
