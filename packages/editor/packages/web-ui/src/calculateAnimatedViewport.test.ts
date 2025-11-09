import { describe, it, expect, beforeEach } from 'vitest';
import { createMockState, createMockCodeBlock } from '@8f4e/editor-state/testing';

import { calculateAnimatedViewport, type AnimationState } from './calculateAnimatedViewport';

describe('calculateAnimatedViewport', () => {
	let animationState: { current: AnimationState | null };
	let previousViewport: { x: number; y: number };

	beforeEach(() => {
		animationState = { current: null };
		previousViewport = { x: 0, y: 0 };
	});

	describe('when viewport animations are disabled', () => {
		it('should return actual viewport position immediately', () => {
			const state = createMockState({
				featureFlags: { viewportAnimations: false },
				graphicHelper: {
					activeViewport: createMockCodeBlock({
						viewport: { x: 100, y: 200 },
					}),
				},
			});

			const result = calculateAnimatedViewport(state, 0, animationState, previousViewport);

			expect(result).toEqual({ x: 100, y: 200 });
			expect(animationState.current).toBeNull();
		});

		it('should cancel active animation when viewport changes', () => {
			// Start with an active animation
			animationState.current = {
				isAnimating: true,
				startViewport: { x: 0, y: 0 },
				targetViewport: { x: 50, y: 50 },
				startTime: 0,
				duration: 300,
			};

			const state = createMockState({
				featureFlags: { viewportAnimations: false },
				graphicHelper: {
					activeViewport: createMockCodeBlock({
						viewport: { x: 100, y: 200 },
					}),
				},
			});

			const result = calculateAnimatedViewport(state, 100, animationState, previousViewport);

			expect(result).toEqual({ x: 100, y: 200 });
			expect(animationState.current).toBeNull();
		});
	});

	describe('when viewport animations are enabled', () => {
		it('should start animation when viewport changes', () => {
			const state = createMockState({
				featureFlags: { viewportAnimations: true },
				graphicHelper: {
					activeViewport: createMockCodeBlock({
						viewport: { x: 100, y: 200 },
					}),
				},
			});

			calculateAnimatedViewport(state, 1000, animationState, previousViewport);

			expect(animationState.current).not.toBeNull();
			expect(animationState.current?.isAnimating).toBe(true);
			expect(animationState.current?.startViewport).toEqual({ x: 0, y: 0 });
			expect(animationState.current?.targetViewport).toEqual({ x: 100, y: 200 });
			expect(animationState.current?.startTime).toBe(1000);
			expect(animationState.current?.duration).toBe(300); // Default duration
		});

		it('should use custom animation duration if provided', () => {
			const state = createMockState({
				featureFlags: { viewportAnimations: true },
				graphicHelper: {
					activeViewport: createMockCodeBlock({
						viewport: { x: 100, y: 200, animationDurationMs: 500 },
					}),
				},
			});

			calculateAnimatedViewport(state, 1000, animationState, previousViewport);

			expect(animationState.current?.duration).toBe(500);
		});

		it('should interpolate position during animation', () => {
			const state = createMockState({
				featureFlags: { viewportAnimations: true },
				graphicHelper: {
					activeViewport: createMockCodeBlock({
						viewport: { x: 100, y: 0 },
					}),
				},
			});

			// Start animation
			calculateAnimatedViewport(state, 0, animationState, previousViewport);

			// Midpoint (50% progress) with cubic easing
			const midpointResult = calculateAnimatedViewport(state, 150, animationState, previousViewport);

			// At 50% progress, cubic ease-in-out should give us exactly 0.5
			expect(midpointResult.x).toBe(50);
			expect(midpointResult.y).toBe(0);
		});

		it('should complete animation and return target position', () => {
			const state = createMockState({
				featureFlags: { viewportAnimations: true },
				graphicHelper: {
					activeViewport: createMockCodeBlock({
						viewport: { x: 100, y: 200 },
					}),
				},
			});

			// Start animation
			calculateAnimatedViewport(state, 0, animationState, previousViewport);

			// Complete animation (elapsed time >= duration)
			const result = calculateAnimatedViewport(state, 300, animationState, previousViewport);

			expect(result).toEqual({ x: 100, y: 200 });
			expect(animationState.current).toBeNull();
		});

		it('should handle multiple viewport changes during animation', () => {
			const state1 = createMockState({
				featureFlags: { viewportAnimations: true },
				graphicHelper: {
					activeViewport: createMockCodeBlock({
						viewport: { x: 100, y: 0 },
					}),
				},
			});

			// Start first animation
			calculateAnimatedViewport(state1, 0, animationState, previousViewport);
			const firstAnimation = animationState.current;

			// Change viewport again before first animation completes
			const state2 = createMockState({
				featureFlags: { viewportAnimations: true },
				graphicHelper: {
					activeViewport: createMockCodeBlock({
						viewport: { x: 200, y: 0 },
					}),
				},
			});

			calculateAnimatedViewport(state2, 100, animationState, previousViewport);

			// Should start new animation from current position
			expect(animationState.current).not.toBe(firstAnimation);
			expect(animationState.current?.startViewport).toEqual({ x: 100, y: 0 });
			expect(animationState.current?.targetViewport).toEqual({ x: 200, y: 0 });
		});
	});

	describe('when viewport has not changed', () => {
		it('should return actual viewport without starting animation', () => {
			const state = createMockState({
				featureFlags: { viewportAnimations: true },
				graphicHelper: {
					activeViewport: createMockCodeBlock({
						viewport: { x: 0, y: 0 },
					}),
				},
			});

			const result = calculateAnimatedViewport(state, 0, animationState, previousViewport);

			expect(result).toEqual({ x: 0, y: 0 });
			expect(animationState.current).toBeNull();
		});

		it('should continue existing animation', () => {
			animationState.current = {
				isAnimating: true,
				startViewport: { x: 0, y: 0 },
				targetViewport: { x: 100, y: 200 },
				startTime: 0,
				duration: 300,
			};
			previousViewport = { x: 100, y: 200 };

			const state = createMockState({
				featureFlags: { viewportAnimations: true },
				graphicHelper: {
					activeViewport: createMockCodeBlock({
						viewport: { x: 100, y: 200 },
					}),
				},
			});

			// Call at 25% progress
			const result = calculateAnimatedViewport(state, 75, animationState, previousViewport);

			// Animation should continue (not complete yet)
			expect(animationState.current).not.toBeNull();
			expect(result.x).toBeGreaterThan(0);
			expect(result.x).toBeLessThan(100);
		});
	});
});
