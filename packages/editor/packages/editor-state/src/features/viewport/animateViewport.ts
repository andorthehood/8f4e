import updateViewport from './updateViewport';

import type { EventDispatcher, State } from '@8f4e/editor-state-types';

const scheduledFrames = new WeakMap<State, number>();

function easeInOutCubic(progress: number): number {
	return progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function clearScheduledFrame(state: State): void {
	const frameId = scheduledFrames.get(state);
	if (frameId === undefined) {
		return;
	}

	state.callbacks.cancelAnimationFrame?.(frameId);
	scheduledFrames.delete(state);
}

export function stopViewportAnimation(state: State): void {
	clearScheduledFrame(state);
	state.viewportAnimation.active = false;
	state.viewportAnimation.startTime = undefined;
}

export default function animateViewport(state: State, x: number, y: number, events?: EventDispatcher): void {
	state.viewportAnimation.startX = state.viewport.x;
	state.viewportAnimation.startY = state.viewport.y;
	state.viewportAnimation.targetX = x;
	state.viewportAnimation.targetY = y;
	state.viewportAnimation.startTime = undefined;

	const requestAnimationFrame = state.callbacks.requestAnimationFrame;
	if (!requestAnimationFrame || !events) {
		stopViewportAnimation(state);
		updateViewport(state, x, y, events);
		return;
	}

	if (state.viewport.x === x && state.viewport.y === y) {
		stopViewportAnimation(state);
		return;
	}

	state.viewportAnimation.active = true;

	if (scheduledFrames.has(state)) {
		return;
	}

	const onFrame = (frameTime: number) => {
		scheduledFrames.delete(state);
		if (!state.viewportAnimation.active) {
			return;
		}

		const startTime = state.viewportAnimation.startTime ?? frameTime;
		state.viewportAnimation.startTime = startTime;

		const durationMs = Math.max(state.viewportAnimation.durationMs, 1);
		const progress = Math.min(Math.max((frameTime - startTime) / durationMs, 0), 1);
		const easedProgress = easeInOutCubic(progress);
		const nextX =
			state.viewportAnimation.startX +
			(state.viewportAnimation.targetX - state.viewportAnimation.startX) * easedProgress;
		const nextY =
			state.viewportAnimation.startY +
			(state.viewportAnimation.targetY - state.viewportAnimation.startY) * easedProgress;

		const shouldSnap = progress >= 1;

		updateViewport(
			state,
			shouldSnap ? state.viewportAnimation.targetX : nextX,
			shouldSnap ? state.viewportAnimation.targetY : nextY,
			events
		);

		if (shouldSnap) {
			stopViewportAnimation(state);
			return;
		}

		const nextFrameId = requestAnimationFrame(onFrame);
		scheduledFrames.set(state, nextFrameId);
	};

	const frameId = requestAnimationFrame(onFrame);
	scheduledFrames.set(state, frameId);
}

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;
	const { createMockState } = await import('~/pureHelpers/testingUtils/testUtils');

	describe('animateViewport', () => {
		it('starts slow and reaches the midpoint halfway through the animation', () => {
			const callbacks: Array<(time: number) => void> = [];
			const state = createMockState({
				viewport: {
					x: 0,
					y: 0,
				},
				viewportAnimation: {
					durationMs: 100,
				},
				callbacks: {
					requestAnimationFrame: vi.fn(callback => {
						callbacks.push(callback);
						return callbacks.length;
					}),
					cancelAnimationFrame: vi.fn(),
				},
			});
			const events = {
				dispatch: vi.fn(),
			} as unknown as EventDispatcher;

			animateViewport(state, 10, 10, events);

			callbacks[0](0);
			callbacks[1](25);

			expect(state.viewport.x).toBe(1);
			expect(state.viewport.y).toBe(1);

			callbacks[2](50);

			expect(state.viewport.x).toBe(5);
			expect(state.viewport.y).toBe(5);
		});

		it('snaps to the exact target coordinates on the final frame', () => {
			const callbacks: Array<(time: number) => void> = [];
			const state = createMockState({
				viewport: {
					x: 0,
					y: 0,
				},
				viewportAnimation: {
					durationMs: 100,
				},
				callbacks: {
					requestAnimationFrame: vi.fn(callback => {
						callbacks.push(callback);
						return callbacks.length;
					}),
					cancelAnimationFrame: vi.fn(),
				},
			});
			const events = {
				dispatch: vi.fn(),
			} as unknown as EventDispatcher;

			animateViewport(state, 10, 10, events);

			callbacks[0](0);
			callbacks[1](100);

			expect(state.viewport.x).toBe(10);
			expect(state.viewport.y).toBe(10);
			expect(state.viewportAnimation.active).toBe(false);
		});
	});
}
