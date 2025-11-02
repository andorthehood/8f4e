import { describe, it, expect, beforeEach, vi } from 'vitest';

import codeBlockNavigation from './codeBlockNavigation';

import type { State, EventDispatcher, InternalKeyboardEvent, CodeBlockGraphicData } from '../types';

describe('codeBlockNavigation', () => {
	let state: State;
	let events: EventDispatcher;
	let onKeydownHandler: (event: InternalKeyboardEvent) => void;
	let selectedBlock: CodeBlockGraphicData;
	let leftBlock: CodeBlockGraphicData;
	let rightBlock: CodeBlockGraphicData;
	let upBlock: CodeBlockGraphicData;
	let downBlock: CodeBlockGraphicData;

	beforeEach(() => {
		// Create mock code blocks
		selectedBlock = createMockCodeBlock(200, 200);
		leftBlock = createMockCodeBlock(0, 200);
		rightBlock = createMockCodeBlock(400, 200);
		upBlock = createMockCodeBlock(200, 0);
		downBlock = createMockCodeBlock(200, 400);

		// Create mock state
		state = {
			graphicHelper: {
				selectedCodeBlock: selectedBlock,
				activeViewport: {
					codeBlocks: new Set([selectedBlock, leftBlock, rightBlock, upBlock, downBlock]),
					viewport: { x: 0, y: 0 },
				},
				globalViewport: { width: 800, height: 600, vGrid: 8, hGrid: 16 },
			},
		} as unknown as State;

		// Create mock event dispatcher
		events = {
			on: vi.fn((eventName: string, callback: (event: InternalKeyboardEvent) => void) => {
				if (eventName === 'keydown') {
					onKeydownHandler = callback;
				}
			}) as EventDispatcher['on'],
			off: vi.fn(),
			dispatch: vi.fn(),
		};

		// Initialize the effect
		codeBlockNavigation(state, events);
	});

	it('should register a keydown event handler', () => {
		expect(events.on).toHaveBeenCalledWith('keydown', expect.any(Function));
	});

	it('should do nothing when metaKey is not pressed', () => {
		const initialBlock = state.graphicHelper.selectedCodeBlock;
		onKeydownHandler({ key: 'ArrowRight', metaKey: false });
		expect(state.graphicHelper.selectedCodeBlock).toBe(initialBlock);
	});

	it('should do nothing when no code block is selected', () => {
		state.graphicHelper.selectedCodeBlock = undefined;
		onKeydownHandler({ key: 'ArrowRight', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(undefined);
	});

	it('should do nothing for non-arrow keys even with metaKey', () => {
		const initialBlock = state.graphicHelper.selectedCodeBlock;
		onKeydownHandler({ key: 'a', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(initialBlock);
	});

	it('should navigate left when Command + ArrowLeft is pressed', () => {
		onKeydownHandler({ key: 'ArrowLeft', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(leftBlock);
	});

	it('should navigate right when Command + ArrowRight is pressed', () => {
		onKeydownHandler({ key: 'ArrowRight', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(rightBlock);
	});

	it('should navigate up when Command + ArrowUp is pressed', () => {
		onKeydownHandler({ key: 'ArrowUp', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(upBlock);
	});

	it('should navigate down when Command + ArrowDown is pressed', () => {
		onKeydownHandler({ key: 'ArrowDown', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(downBlock);
	});

	it('should center viewport on the newly selected code block', () => {
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
		// Remove all blocks except selected
		state.graphicHelper.activeViewport.codeBlocks = new Set([selectedBlock]);

		onKeydownHandler({ key: 'ArrowRight', metaKey: true });
		expect(state.graphicHelper.selectedCodeBlock).toBe(selectedBlock);
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
		cursor: { col: 0, row: 0, x: 0, y: 0 },
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
