import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import presentation from './effect';

import type { CodeBlockGraphicData, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';

import { createMockViewport } from '~/pureHelpers/testingUtils/testUtils';

function createCodeBlock(
	creationIndex: number,
	x: number,
	y: number,
	order: number,
	seconds: number,
	alignment?: 'center' | 'left' | 'right' | 'top' | 'bottom'
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
			{
				prefix: '@',
				name: 'stop',
				args: alignment ? [String(order), String(seconds), alignment] : [String(order), String(seconds)],
				rawRow: 1,
				isTrailing: false,
			},
		],
	} as CodeBlockGraphicData;
}

describe('presentation effect', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
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
			presentation: {
				canPresent: false,
				activeStopIndex: 0,
				totalStops: 0,
				remainingMs: 0,
				currentStopDurationMs: 0,
				deadlineAt: undefined,
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
		expect(state.presentation.canPresent).toBe(true);

		store.set('editorMode', 'presentation');
		scheduledFrame?.(16);
		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[0]);
		expect(state.viewportAnimation.durationMs).toBe(2000);
		expect(state.presentation.activeStopIndex).toBe(0);
		expect(state.presentation.totalStops).toBe(2);
		expect(state.presentation.remainingMs).toBe(5000);
		expect(state.presentation.deadlineAt).toBe(Date.now() + 5000);
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
		expect(state.presentation.activeStopIndex).toBe(1);
		expect(state.presentation.totalStops).toBe(2);
		expect(state.presentation.remainingMs).toBe(3000);
		expect(state.presentation.deadlineAt).toBe(Date.now() + 3000);
		expect(state.viewportAnimation.targetX).toBe(310);
		expect(state.viewportAnimation.targetY).toBe(440);
		expect(state.viewportAnimation.durationMs).toBe(2000);

		cleanup();
	});

	it('supports left and right presentation alignment anchors', () => {
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
				codeBlocks: [createCodeBlock(1, 100, 200, 1, 5, 'left'), createCodeBlock(2, 400, 500, 2, 3, 'right')],
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
			presentation: {
				canPresent: false,
				activeStopIndex: 0,
				totalStops: 0,
				remainingMs: 0,
				currentStopDurationMs: 0,
				deadlineAt: undefined,
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
		expect(state.viewportAnimation.targetX).toBe(85);
		expect(state.presentation.activeStopIndex).toBe(0);
		expect(state.presentation.totalStops).toBe(2);

		vi.advanceTimersByTime(5000);
		scheduledFrame?.(5016);
		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[1]);
		expect(state.viewportAnimation.targetX).toBe(235);
		expect(state.presentation.activeStopIndex).toBe(1);
	});

	it('supports top and bottom presentation alignment anchors', () => {
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
				codeBlocks: [createCodeBlock(1, 100, 200, 1, 5, 'top'), createCodeBlock(2, 400, 500, 2, 3, 'bottom')],
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
			presentation: {
				activeStopIndex: 0,
				totalStops: 0,
				remainingMs: 0,
				currentStopDurationMs: 0,
				deadlineAt: undefined,
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
		expect(state.viewportAnimation.targetY).toBe(190);
		expect(state.presentation.activeStopIndex).toBe(0);
		expect(state.presentation.totalStops).toBe(2);

		vi.advanceTimersByTime(5000);
		scheduledFrame?.(5016);
		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[1]);
		expect(state.viewportAnimation.targetY).toBe(390);
		expect(state.presentation.activeStopIndex).toBe(1);
	});

	it('jumps between presentation stops with manual previous and next events', () => {
		const modeSubscribers: Array<(value: State['editorMode']) => void> = [];
		const eventHandlers = new Map<string, (payload?: unknown) => void>();
		const state = {
			callbacks: {
				requestAnimationFrame: vi.fn(() => 1),
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
			presentation: {
				activeStopIndex: 0,
				totalStops: 0,
				remainingMs: 0,
				currentStopDurationMs: 0,
				deadlineAt: undefined,
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
			on: vi.fn((eventName: string, callback: (payload?: unknown) => void) => {
				eventHandlers.set(eventName, callback);
			}),
			off: vi.fn((eventName: string) => {
				eventHandlers.delete(eventName);
			}),
		} as unknown as EventDispatcher;

		presentation(store, events);
		store.set('editorMode', 'presentation');

		eventHandlers.get('nextPresentationStop')?.();
		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[1]);
		expect(state.presentation.activeStopIndex).toBe(1);
		expect(state.presentation.totalStops).toBe(2);
		expect(state.presentation.remainingMs).toBe(3000);
		expect(state.viewportAnimation.targetX).toBe(310);
		expect(state.viewportAnimation.targetY).toBe(440);

		eventHandlers.get('previousPresentationStop')?.();
		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[0]);
		expect(state.presentation.activeStopIndex).toBe(0);
		expect(state.presentation.remainingMs).toBe(5000);
		expect(state.viewportAnimation.targetX).toBe(10);
		expect(state.viewportAnimation.targetY).toBe(140);
	});

	it('restarts the current stop timer after a manual skip', () => {
		const modeSubscribers: Array<(value: State['editorMode']) => void> = [];
		const eventHandlers = new Map<string, (payload?: unknown) => void>();
		const state = {
			callbacks: {
				requestAnimationFrame: vi.fn(() => 1),
				cancelAnimationFrame: vi.fn(),
			},
			featureFlags: {},
			editorMode: 'view',
			graphicHelper: {
				codeBlocks: [createCodeBlock(1, 100, 200, 1, 5), createCodeBlock(2, 400, 500, 2, 3)],
				selectedCodeBlock: undefined,
			},
			viewport: createMockViewport(50, 60, 300, 200),
			viewportAnimation: {
				startX: 50,
				startY: 60,
				targetX: 50,
				targetY: 60,
				active: false,
				durationMs: 90,
			},
			presentation: {
				activeStopIndex: 0,
				totalStops: 0,
				remainingMs: 0,
				currentStopDurationMs: 0,
				deadlineAt: undefined,
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
			on: vi.fn((eventName: string, callback: (payload?: unknown) => void) => {
				eventHandlers.set(eventName, callback);
			}),
			off: vi.fn((eventName: string) => {
				eventHandlers.delete(eventName);
			}),
		} as unknown as EventDispatcher;

		presentation(store, events);
		store.set('editorMode', 'presentation');

		vi.advanceTimersByTime(4000);
		eventHandlers.get('nextPresentationStop')?.();
		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[1]);
		expect(state.presentation.deadlineAt).toBe(Date.now() + 3000);

		vi.advanceTimersByTime(2999);
		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[1]);

		vi.advanceTimersByTime(1);
		expect(state.editorMode).toBe('view');
		expect(state.graphicHelper.selectedCodeBlock).toBeUndefined();
		expect(state.viewportAnimation.targetX).toBe(50);
		expect(state.viewportAnimation.targetY).toBe(60);
		expect(state.presentation.totalStops).toBe(0);
		expect(state.presentation.activeStopIndex).toBe(0);
	});

	it('returns to the starting viewport instead of looping after the last timed stop', () => {
		const modeSubscribers: Array<(value: State['editorMode']) => void> = [];
		const state = {
			callbacks: {
				requestAnimationFrame: vi.fn(() => 1),
				cancelAnimationFrame: vi.fn(),
			},
			featureFlags: {},
			editorMode: 'view',
			graphicHelper: {
				codeBlocks: [createCodeBlock(1, 100, 200, 1, 2), createCodeBlock(2, 400, 500, 2, 3)],
				selectedCodeBlock: undefined,
			},
			viewport: createMockViewport(80, 120, 300, 200),
			viewportAnimation: {
				startX: 80,
				startY: 120,
				targetX: 80,
				targetY: 120,
				active: false,
				durationMs: 90,
			},
			presentation: {
				activeStopIndex: 0,
				totalStops: 0,
				remainingMs: 0,
				currentStopDurationMs: 0,
				deadlineAt: undefined,
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

		vi.advanceTimersByTime(2000);
		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[1]);
		expect(state.presentation.activeStopIndex).toBe(1);

		vi.advanceTimersByTime(3000);
		expect(state.editorMode).toBe('view');
		expect(state.graphicHelper.selectedCodeBlock).toBeUndefined();
		expect(state.viewportAnimation.targetX).toBe(80);
		expect(state.viewportAnimation.targetY).toBe(120);
		expect(state.presentation.totalStops).toBe(0);
		expect(state.presentation.activeStopIndex).toBe(0);
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
			presentation: {
				activeStopIndex: 0,
				totalStops: 0,
				remainingMs: 0,
				currentStopDurationMs: 0,
				deadlineAt: undefined,
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

		expect(state.presentation.canPresent).toBe(false);
		expect(store.set).toHaveBeenLastCalledWith('editorMode', 'view');
		expect(events.dispatch).not.toHaveBeenCalled();
		expect(state.presentation.totalStops).toBe(0);
		expect(state.presentation.deadlineAt).toBeUndefined();
	});

	it('updates presentation availability when code blocks change', () => {
		const codeBlockSubscribers: Array<(value: CodeBlockGraphicData[]) => void> = [];
		const state = {
			callbacks: {},
			featureFlags: {},
			editorMode: 'view',
			graphicHelper: {
				codeBlocks: [],
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
			presentation: {
				canPresent: false,
				activeStopIndex: 0,
				totalStops: 0,
				remainingMs: 0,
				currentStopDurationMs: 0,
				deadlineAt: undefined,
			},
		} as State;

		const store = {
			getState: () => state,
			set: vi.fn(),
			subscribe: vi.fn((path: string, callback: (value: unknown) => void) => {
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

		presentation(store, events);
		expect(state.presentation.canPresent).toBe(false);

		state.graphicHelper.codeBlocks = [createCodeBlock(1, 100, 200, 1, 5)];
		codeBlockSubscribers.forEach(callback => callback(state.graphicHelper.codeBlocks));
		expect(state.presentation.canPresent).toBe(true);

		state.graphicHelper.codeBlocks = [];
		codeBlockSubscribers.forEach(callback => callback(state.graphicHelper.codeBlocks));
		expect(state.presentation.canPresent).toBe(false);
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
			presentation: {
				activeStopIndex: 0,
				totalStops: 0,
				remainingMs: 0,
				currentStopDurationMs: 0,
				deadlineAt: undefined,
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
		expect(state.presentation.totalStops).toBe(1);
		expect(state.presentation.deadlineAt).toBe(Date.now() + 2000);

		store.set('editorMode', 'view');
		expect(state.viewportAnimation.active).toBe(false);
		expect(state.viewportAnimation.startTime).toBeUndefined();
		expect(state.callbacks.cancelAnimationFrame).toHaveBeenCalled();
		expect(state.presentation.totalStops).toBe(0);
		expect(state.presentation.deadlineAt).toBeUndefined();
	});

	it('resumes from the last active stop when presentation mode is re-entered', () => {
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
			presentation: {
				activeStopIndex: 0,
				totalStops: 0,
				remainingMs: 0,
				currentStopDurationMs: 0,
				deadlineAt: undefined,
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
		vi.advanceTimersByTime(5000);
		scheduledFrame?.(5016);

		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[1]);
		expect(state.presentation.activeStopIndex).toBe(1);

		store.set('editorMode', 'view');
		expect(state.presentation.activeStopIndex).toBe(1);
		expect(state.presentation.totalStops).toBe(0);

		store.set('editorMode', 'presentation');
		scheduledFrame?.(5032);

		expect(state.graphicHelper.selectedCodeBlock).toBe(state.graphicHelper.codeBlocks[1]);
		expect(state.presentation.activeStopIndex).toBe(1);
		expect(state.presentation.totalStops).toBe(2);
		expect(state.presentation.remainingMs).toBe(3000);
	});
});
