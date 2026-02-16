import { describe, it, expect, beforeEach, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import codeBlockDragger from './effect';

import { createCodeBlockGraphicData } from '../../utils/createCodeBlockGraphicData';

import type { State, InternalMouseEvent, EventDispatcher } from '~/types';

describe('codeBlockDragger', () => {
	let state: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let events: EventDispatcher;
	let mousedownHandlers: Array<(event: InternalMouseEvent) => void>;
	let mousemoveHandlers: Array<(event: InternalMouseEvent) => void>;
	let mouseupHandlers: Array<() => void>;

	beforeEach(() => {
		// Initialize state
		state = {
			featureFlags: {
				moduleDragging: true,
			},
			graphicHelper: {
				codeBlocks: [],
				draggedCodeBlock: undefined,
				selectedCodeBlock: undefined,
				nextCodeBlockCreationIndex: 0,
				outputsByWordAddress: new Map(),
				contextMenu: { visible: false, x: 0, y: 0, items: [] },
				postProcessEffects: [],
				backgroundEffects: [],
			},
			viewport: {
				x: 0,
				y: 0,
				vGrid: 10,
				hGrid: 20,
				width: 800,
				height: 600,
				gridCoordinates: { x: 0, y: 0 },
			},
		} as State;

		store = createStateManager(state);

		mousedownHandlers = [];
		mousemoveHandlers = [];
		mouseupHandlers = [];

		events = {
			on: vi.fn((eventName: string, callback: (event: InternalMouseEvent | void) => void) => {
				if (eventName === 'mousedown') mousedownHandlers.push(callback as (event: InternalMouseEvent) => void);
				if (eventName === 'mousemove') mousemoveHandlers.push(callback as (event: InternalMouseEvent) => void);
				if (eventName === 'mouseup') mouseupHandlers.push(callback as () => void);
			}),
			off: vi.fn(),
			dispatch: vi.fn(),
		};
	});

	describe('single block drag (no modifier)', () => {
		it('should drag a single block without Alt key', () => {
			const block1 = createCodeBlockGraphicData({
				code: ['module test1', 'moduleEnd'],
				gridX: 5,
				gridY: 5,
				x: 50,
				y: 100,
				creationIndex: 0,
				blockType: 'module',
			});

			state.graphicHelper.codeBlocks = [block1];

			codeBlockDragger(store, events);

			// Mousedown without Alt key
			mousedownHandlers[0]({
				x: 50,
				y: 100,
				movementX: 0,
				movementY: 0,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: false,
			});

			expect(state.graphicHelper.draggedCodeBlock).toBe(block1);

			// Mousemove
			mousemoveHandlers[0]({
				x: 60,
				y: 110,
				movementX: 10,
				movementY: 10,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: false,
			});

			expect(block1.x).toBe(60);
			expect(block1.y).toBe(110);

			// Mouseup
			mouseupHandlers[0]();

			expect(block1.gridX).toBe(6); // Math.round(60 / 10)
			expect(block1.gridY).toBe(6); // Math.round(110 / 20)
			expect(block1.x).toBe(60); // 6 * 10
			expect(block1.y).toBe(120); // 6 * 20
			expect(state.graphicHelper.draggedCodeBlock).toBeUndefined();
		});

		it('should not drag other blocks without Alt key', () => {
			const block1 = createCodeBlockGraphicData({
				code: ['module test1', '; @group audio', 'moduleEnd'],
				gridX: 5,
				gridY: 5,
				x: 50,
				y: 100,
				creationIndex: 0,
				blockType: 'module',
				groupName: 'audio',
			});

			const block2 = createCodeBlockGraphicData({
				code: ['module test2', '; @group audio', 'moduleEnd'],
				gridX: 10,
				gridY: 10,
				x: 100,
				y: 200,
				creationIndex: 1,
				blockType: 'module',
				groupName: 'audio',
			});

			state.graphicHelper.codeBlocks = [block1, block2];

			codeBlockDragger(store, events);

			// Mousedown on block1 without Alt key
			mousedownHandlers[0]({
				x: 50,
				y: 100,
				movementX: 0,
				movementY: 0,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: false,
			});

			// Mousemove
			mousemoveHandlers[0]({
				x: 60,
				y: 110,
				movementX: 10,
				movementY: 10,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: false,
			});

			expect(block1.x).toBe(60);
			expect(block1.y).toBe(110);
			// block2 should not move
			expect(block2.x).toBe(100);
			expect(block2.y).toBe(200);
		});
	});

	describe('grouped drag (with Alt modifier)', () => {
		it('should drag all blocks in same group with Alt key', () => {
			const block1 = createCodeBlockGraphicData({
				code: ['module test1', '; @group audio', 'moduleEnd'],
				gridX: 5,
				gridY: 5,
				x: 50,
				y: 100,
				creationIndex: 0,
				blockType: 'module',
				groupName: 'audio',
			});

			const block2 = createCodeBlockGraphicData({
				code: ['module test2', '; @group audio', 'moduleEnd'],
				gridX: 10,
				gridY: 10,
				x: 100,
				y: 200,
				creationIndex: 1,
				blockType: 'module',
				groupName: 'audio',
			});

			const block3 = createCodeBlockGraphicData({
				code: ['module test3', 'moduleEnd'],
				gridX: 15,
				gridY: 15,
				x: 150,
				y: 300,
				creationIndex: 2,
				blockType: 'module',
			});

			state.graphicHelper.codeBlocks = [block1, block2, block3];

			codeBlockDragger(store, events);

			// Mousedown on block1 with Alt key
			mousedownHandlers[0]({
				x: 50,
				y: 100,
				movementX: 0,
				movementY: 0,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: true,
			});

			expect(state.graphicHelper.draggedCodeBlock).toBe(block1);

			// Mousemove
			mousemoveHandlers[0]({
				x: 60,
				y: 110,
				movementX: 10,
				movementY: 10,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: true,
			});

			// Both block1 and block2 should move
			expect(block1.x).toBe(60);
			expect(block1.y).toBe(110);
			expect(block2.x).toBe(110);
			expect(block2.y).toBe(210);
			// block3 should not move (different group)
			expect(block3.x).toBe(150);
			expect(block3.y).toBe(300);

			// Mouseup
			mouseupHandlers[0]();

			// Both blocks should snap to grid
			expect(block1.gridX).toBe(6);
			expect(block1.gridY).toBe(6);
			expect(block1.x).toBe(60);
			expect(block1.y).toBe(120);

			expect(block2.gridX).toBe(11);
			expect(block2.gridY).toBe(11);
			expect(block2.x).toBe(110);
			expect(block2.y).toBe(220);

			// block3 unchanged
			expect(block3.gridX).toBe(15);
			expect(block3.gridY).toBe(15);

			expect(state.graphicHelper.draggedCodeBlock).toBeUndefined();
		});

		it('should not group drag if block has no group name with Alt key', () => {
			const block1 = createCodeBlockGraphicData({
				code: ['module test1', 'moduleEnd'],
				gridX: 5,
				gridY: 5,
				x: 50,
				y: 100,
				creationIndex: 0,
				blockType: 'module',
			});

			const block2 = createCodeBlockGraphicData({
				code: ['module test2', 'moduleEnd'],
				gridX: 10,
				gridY: 10,
				x: 100,
				y: 200,
				creationIndex: 1,
				blockType: 'module',
			});

			state.graphicHelper.codeBlocks = [block1, block2];

			codeBlockDragger(store, events);

			// Mousedown on block1 with Alt key but no group
			mousedownHandlers[0]({
				x: 50,
				y: 100,
				movementX: 0,
				movementY: 0,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: true,
			});

			// Mousemove
			mousemoveHandlers[0]({
				x: 60,
				y: 110,
				movementX: 10,
				movementY: 10,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: true,
			});

			// Only block1 should move (no group)
			expect(block1.x).toBe(60);
			expect(block1.y).toBe(110);
			expect(block2.x).toBe(100);
			expect(block2.y).toBe(200);
		});

		it('should drag blocks in different groups separately', () => {
			const block1 = createCodeBlockGraphicData({
				code: ['module test1', '; @group audio', 'moduleEnd'],
				gridX: 5,
				gridY: 5,
				x: 50,
				y: 100,
				creationIndex: 0,
				blockType: 'module',
				groupName: 'audio',
			});

			const block2 = createCodeBlockGraphicData({
				code: ['module test2', '; @group visual', 'moduleEnd'],
				gridX: 10,
				gridY: 10,
				x: 100,
				y: 200,
				creationIndex: 1,
				blockType: 'module',
				groupName: 'visual',
			});

			state.graphicHelper.codeBlocks = [block1, block2];

			codeBlockDragger(store, events);

			// Mousedown on block1 with Alt key
			mousedownHandlers[0]({
				x: 50,
				y: 100,
				movementX: 0,
				movementY: 0,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: true,
			});

			// Mousemove
			mousemoveHandlers[0]({
				x: 60,
				y: 110,
				movementX: 10,
				movementY: 10,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: true,
			});

			// Only block1 should move (different groups)
			expect(block1.x).toBe(60);
			expect(block1.y).toBe(110);
			expect(block2.x).toBe(100);
			expect(block2.y).toBe(200);
		});
	});

	describe('stopPropagation behavior', () => {
		it('should set stopPropagation to true while dragging', () => {
			const block1 = createCodeBlockGraphicData({
				code: ['module test1', 'moduleEnd'],
				gridX: 5,
				gridY: 5,
				x: 50,
				y: 100,
				creationIndex: 0,
				blockType: 'module',
			});

			state.graphicHelper.codeBlocks = [block1];

			codeBlockDragger(store, events);

			// Mousedown
			mousedownHandlers[0]({
				x: 50,
				y: 100,
				movementX: 0,
				movementY: 0,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: false,
			});

			// Mousemove
			const moveEvent = {
				x: 60,
				y: 110,
				movementX: 10,
				movementY: 10,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: false,
			};
			mousemoveHandlers[0](moveEvent);

			expect(moveEvent.stopPropagation).toBe(true);
		});
	});

	describe('feature flag', () => {
		it('should not drag if moduleDragging feature is disabled', () => {
			state.featureFlags.moduleDragging = false;

			const block1 = createCodeBlockGraphicData({
				code: ['module test1', 'moduleEnd'],
				gridX: 5,
				gridY: 5,
				x: 50,
				y: 100,
				creationIndex: 0,
				blockType: 'module',
			});

			state.graphicHelper.codeBlocks = [block1];

			codeBlockDragger(store, events);

			// Mousedown
			mousedownHandlers[0]({
				x: 50,
				y: 100,
				movementX: 0,
				movementY: 0,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: false,
			});

			expect(state.graphicHelper.draggedCodeBlock).toBeUndefined();
		});
	});

	describe('selected code block', () => {
		it('should set selected code block on mousedown', () => {
			const block1 = createCodeBlockGraphicData({
				code: ['module test1', 'moduleEnd'],
				gridX: 5,
				gridY: 5,
				x: 50,
				y: 100,
				creationIndex: 0,
				blockType: 'module',
			});

			state.graphicHelper.codeBlocks = [block1];

			codeBlockDragger(store, events);

			// Mousedown
			mousedownHandlers[0]({
				x: 50,
				y: 100,
				movementX: 0,
				movementY: 0,
				buttons: 1,
				stopPropagation: false,
				canvasWidth: 800,
				canvasHeight: 600,
				altKey: false,
			});

			expect(state.graphicHelper.selectedCodeBlock).toBe(block1);
		});
	});
});
