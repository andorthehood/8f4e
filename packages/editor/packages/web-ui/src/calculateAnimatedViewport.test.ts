import { describe, it, expect } from 'vitest';

import { calculateAnimatedViewportState, type AnimationState } from './calculateAnimatedViewport';

describe('calculateAnimatedViewportState', () => {
	it('returns actual viewport when there is no change', () => {
		const actualViewport = { x: 100, y: 200, animationDurationMs: 300 };
		const previousViewport = { x: 100, y: 200 };
		const animationState: AnimationState | null = null;

		const {
			effectiveViewport,
			animationState: nextState,
			previousViewport: nextPrev,
		} = calculateAnimatedViewportState({
			actualViewport,
			viewportAnimationsEnabled: true,
			currentTime: 1000,
			previousViewport,
			animationState,
		});

		expect(effectiveViewport).toEqual({ x: 100, y: 200 });
		expect(nextState).toBeNull();
		expect(nextPrev).toEqual({ x: 100, y: 200 });
	});

	it('starts an animation when viewport changes and animations are enabled (handles negative coordinates)', () => {
		const actualViewport = { x: -300, y: -400, animationDurationMs: 1000 };
		const previousViewport = { x: -100, y: -200 };

		const {
			effectiveViewport,
			animationState,
			previousViewport: nextPrev,
		} = calculateAnimatedViewportState({
			actualViewport,
			viewportAnimationsEnabled: true,
			currentTime: 0,
			previousViewport,
			animationState: null,
		});

		// First frame of animation should be at the start position
		expect(effectiveViewport.x).toBe(-100);
		expect(effectiveViewport.y).toBe(-200);
		expect(Number.isNaN(effectiveViewport.x)).toBe(false);
		expect(Number.isNaN(effectiveViewport.y)).toBe(false);

		expect(animationState).not.toBeNull();
		expect(animationState?.startViewport).toEqual({ x: -100, y: -200 });
		expect(animationState?.targetViewport).toEqual({ x: -300, y: -400 });
		expect(nextPrev).toEqual({ x: -300, y: -400 });
	});

	it('completes the animation when progress reaches 1', () => {
		const actualViewport = { x: 500, y: 600, animationDurationMs: 1000 };
		const previousViewport = { x: 500, y: 600 }; // Should match target when animation was created
		const animationState: AnimationState = {
			isAnimating: true,
			startViewport: { x: 100, y: 200 },
			targetViewport: { x: 500, y: 600 },
			startTime: 0,
			duration: 1000,
		};

		const { effectiveViewport, animationState: nextState } = calculateAnimatedViewportState({
			actualViewport,
			viewportAnimationsEnabled: true,
			currentTime: 1000,
			previousViewport,
			animationState,
		});

		expect(effectiveViewport).toEqual({ x: 500, y: 600 });
		expect(nextState).toBeNull();
	});

	it('disables animation for non-positive durations to avoid NaN/Infinity', () => {
		const actualViewport = { x: -50, y: -75, animationDurationMs: 0 };
		const previousViewport = { x: 0, y: 0 };

		const {
			effectiveViewport,
			animationState,
			previousViewport: nextPrev,
		} = calculateAnimatedViewportState({
			actualViewport,
			viewportAnimationsEnabled: true,
			currentTime: 1234,
			previousViewport,
			animationState: null,
		});

		expect(effectiveViewport).toEqual({ x: -50, y: -75 });
		expect(Number.isNaN(effectiveViewport.x)).toBe(false);
		expect(Number.isNaN(effectiveViewport.y)).toBe(false);
		expect(animationState).toBeNull();
		expect(nextPrev).toEqual({ x: -50, y: -75 });
	});

	it('returns actual viewport when animations are disabled even if viewport changed', () => {
		const actualViewport = { x: -10, y: -20, animationDurationMs: 300 };
		const previousViewport = { x: 0, y: 0 };

		const {
			effectiveViewport,
			animationState,
			previousViewport: nextPrev,
		} = calculateAnimatedViewportState({
			actualViewport,
			viewportAnimationsEnabled: false,
			currentTime: 500,
			previousViewport,
			animationState: null,
		});

		expect(effectiveViewport).toEqual({ x: -10, y: -20 });
		expect(animationState).toBeNull();
		expect(nextPrev).toEqual({ x: -10, y: -20 });
	});
});
