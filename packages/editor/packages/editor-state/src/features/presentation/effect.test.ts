import { beforeEach, describe, expect, it, vi } from 'vitest';

import presentation from './effect';

import type { CodeBlockGraphicData, EventDispatcher, State } from '~/types';
import type { StateManager } from '@8f4e/state-manager';

import { createMockViewport } from '~/pureHelpers/testingUtils/testUtils';

function createCodeBlock(
	creationIndex: number,
	x: number,
	y: number,
	order: number,
	seconds: number
): CodeBlockGraphicData {
	return {
		creationIndex,
		x,
		y,
		width: 120,
		height: 80,
		offsetX: 0,
		offsetY: 0,
		parsedDirectives: [
			{ prefix: '@', name: 'stop', args: [String(order), String(seconds)], rawRow: 1, isTrailing: false },
		],
	} as CodeBlockGraphicData;
}

describe('presentation effect', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	it('centers the first tagged block and advances on its timer', () => {
		const modeSubscribers: Array<(value: State['editorMode']) => void> = [];
		const codeBlockSubscribers: Array<(value: CodeBlockGraphicData[]) => void> = [];
		let scheduledFrame: ((time: number) => void) | undefined;
		const state = {
			callbacks: {
				requestAnimationFrame: vi.fn(callback => {
					scheduledFrame = callback;
					return 1;
				}),
				cancelAnimationFrame: vi.fn(),
			},
			featureFlags: {},
			editorMode: 'view',
			graphicHelper: {
				codeBlocks: [createCodeBlock(1, 100, 200, 1, 5), createCodeBlock(2, 400, 500, 2, 3)],
				selectedCodeBlock: undefined,
			},
			viewport: createMockViewport(0, 0, 300, 200),
			viewportAnimation: {
				startX: 0,
				startY: 0,
				targetX: 0,
				targetY: 0,
				active: false,
				durationMs: 90,
			},
		} as State;

		const store = {
			getState: () => state,
			set: vi.fn((path: string, value: unknown) => {
				if (path === 'editorMode') {
					state.editorMode = value as State['editorMode'];
					modeSubscribers.forEach(callback => callback(value as State['editorMode']));
				}
				if (path === 'graphicHelper.selectedCodeBlock') {
					state.graphicHelper.selectedCodeBlock = value as CodeBlockGraphicData | undefined;
				}
			}),
			subscribe: vi.fn((path: string, callback: (value: unknown) => void) => {
				if (path === 'editorMode') {
					modeSubscribers.push(callback as (value: State['editorMode']) => void);
				}
				if (path === 'graphicHelper.codeBlocks') {
					codeBlockSubscribers.push(callback as (value: CodeBlockGraphicData[]) => void);
				}
				return { selector: path, callback };
			}),
			unsubscribe: vi.fn(),
		} as unknown as StateManager<State>;

		const events = {
			dispatch: vi.fn(),
			on: vi.fn(),
			off: vi.fn(),
		} as unknown as EventDispatcher;

		const cleanup = presentation(store, events);

		store.set('editorMode', 'presentation');
		scheduledFrame?.(16);
		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[0]);
		expect(state.viewportAnimation.durationMs).toBe(2000);
		expect(state.viewport.x).toBe(0);
		expect(state.viewport.y).toBe(0);

		vi.advanceTimersByTime(2000);
		scheduledFrame?.(2016);
		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[0]);
		expect(state.viewport.x).toBe(10);
		expect(state.viewport.y).toBe(140);

		vi.advanceTimersByTime(3000);
		scheduledFrame?.(5016);
		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[1]);
		expect(state.viewportAnimation.targetX).toBe(310);
		expect(state.viewportAnimation.targetY).toBe(440);
		expect(state.viewportAnimation.durationMs).toBe(2000);

		cleanup();
	});

	it('exits immediately when presentation mode has no tagged blocks', () => {
		const modeSubscribers: Array<(value: State['editorMode']) => void> = [];
		const state = {
			callbacks: {},
			featureFlags: {},
			editorMode: 'view',
			graphicHelper: { codeBlocks: [] },
			viewport: createMockViewport(0, 0, 300, 200),
			viewportAnimation: {
				startX: 0,
				startY: 0,
				targetX: 0,
				targetY: 0,
				active: false,
				durationMs: 90,
			},
		} as State;

		const store = {
			getState: () => state,
			set: vi.fn((path: string, value: unknown) => {
				if (path === 'editorMode') {
					state.editorMode = value as State['editorMode'];
					modeSubscribers.forEach(callback => callback(value as State['editorMode']));
				}
			}),
			subscribe: vi.fn((path: string, callback: (value: unknown) => void) => {
				if (path === 'editorMode') {
					modeSubscribers.push(callback as (value: State['editorMode']) => void);
				}
				return { selector: path, callback };
			}),
			unsubscribe: vi.fn(),
		} as unknown as StateManager<State>;

		const events = {
			dispatch: vi.fn(),
			on: vi.fn(),
			off: vi.fn(),
		} as unknown as EventDispatcher;

		presentation(store, events);
		store.set('editorMode', 'presentation');

		expect(store.set).toHaveBeenLastCalledWith('editorMode', 'view');
		expect(events.dispatch).not.toHaveBeenCalled();
	});

	it('cancels viewport animation when presentation mode is exited externally', () => {
		const modeSubscribers: Array<(value: State['editorMode']) => void> = [];
		let scheduledFrame: ((time: number) => void) | undefined;
		const state = {
			callbacks: {
				requestAnimationFrame: vi.fn(callback => {
					scheduledFrame = callback;
					return 1;
				}),
				cancelAnimationFrame: vi.fn(),
			},
			featureFlags: {},
			editorMode: 'view',
			graphicHelper: {
				codeBlocks: [createCodeBlock(1, 100, 200, 1, 2)],
				selectedCodeBlock: undefined,
			},
			viewport: createMockViewport(0, 0, 300, 200),
			viewportAnimation: {
				startX: 0,
				startY: 0,
				targetX: 0,
				targetY: 0,
				active: false,
				durationMs: 90,
			},
		} as State;

		const store = {
			getState: () => state,
			set: vi.fn((path: string, value: unknown) => {
				if (path === 'editorMode') {
					state.editorMode = value as State['editorMode'];
					modeSubscribers.forEach(callback => callback(value as State['editorMode']));
				}
				if (path === 'graphicHelper.selectedCodeBlock') {
					state.graphicHelper.selectedCodeBlock = value as CodeBlockGraphicData | undefined;
				}
			}),
			subscribe: vi.fn((path: string, callback: (value: unknown) => void) => {
				if (path === 'editorMode') {
					modeSubscribers.push(callback as (value: State['editorMode']) => void);
				}
				return { selector: path, callback };
			}),
			unsubscribe: vi.fn(),
		} as unknown as StateManager<State>;

		const events = {
			dispatch: vi.fn(),
			on: vi.fn(),
			off: vi.fn(),
		} as unknown as EventDispatcher;

		presentation(store, events);

		store.set('editorMode', 'presentation');
		scheduledFrame?.(16);
		expect(state.viewportAnimation.active).toBe(true);

		store.set('editorMode', 'view');
		expect(state.viewportAnimation.active).toBe(false);
		expect(state.viewportAnimation.startTime).toBeUndefined();
		expect(state.callbacks.cancelAnimationFrame).toHaveBeenCalled();
	});
});
