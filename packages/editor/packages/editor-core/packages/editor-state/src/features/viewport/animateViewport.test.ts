import { describe, expect, it, vi } from 'vitest';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import animateViewport from './animateViewport';

const { createMockState } = await import('~/pureHelpers/testingUtils/testUtils');

describe('animateViewport', () => {
	it('updates immediately and emits viewportChanged when the host has no frame scheduler', () => {
		const state = createMockState();
		const events = createMockEventDispatcherWithVitest();

		animateViewport(state, 24, 40, events);

		expect(state.viewport.x).toBe(24);
		expect(state.viewport.y).toBe(40);
		expect(state.viewportAnimation.active).toBe(false);
		expect(events.dispatch).toHaveBeenCalledWith('viewportChanged', {
			previousX: 0,
			previousY: 0,
			x: 24,
			y: 40,
		});
	});

	it('starts slow and reaches the midpoint halfway through the animation', () => {
		const callbacks: Array<(time: number) => void> = [];
		const state = createMockState({
			viewport: {
				x: 0,
				y: 0,
			},
			callbacks: {
				requestAnimationFrame: vi.fn(callback => {
					callbacks.push(callback);
					return callbacks.length;
				}),
				cancelAnimationFrame: vi.fn(),
			},
		});
		const events = createMockEventDispatcherWithVitest();

		animateViewport(state, 10, 10, events);

		callbacks[0](0);
		callbacks[1](125);

		expect(state.viewport.x).toBe(1);
		expect(state.viewport.y).toBe(1);

		callbacks[2](250);

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
			callbacks: {
				requestAnimationFrame: vi.fn(callback => {
					callbacks.push(callback);
					return callbacks.length;
				}),
				cancelAnimationFrame: vi.fn(),
			},
		});
		const events = createMockEventDispatcherWithVitest();

		animateViewport(state, 10, 10, events);

		callbacks[0](0);
		callbacks[1](500);

		expect(state.viewport.x).toBe(10);
		expect(state.viewport.y).toBe(10);
		expect(state.viewportAnimation.active).toBe(false);
	});
});
