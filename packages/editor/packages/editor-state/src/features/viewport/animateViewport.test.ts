import type { EventDispatcher } from '@8f4e/editor-state-types';
import { describe, expect, it, vi } from 'vitest';
import animateViewport from './animateViewport';

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
