import type { State } from '@8f4e/editor-state';

/**
 * Animation state for viewport transitions.
 * Kept local to web-ui package - editor-state remains unaware of animations.
 */
export interface AnimationState {
	isAnimating: boolean;
	startViewport: { x: number; y: number };
	targetViewport: { x: number; y: number };
	startTime: number;
	duration: number;
}

/**
 * Cubic ease-in-out easing function for smooth animations.
 * Accelerates at the start and decelerates at the end.
 */
function easeInOutCubic(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Default animation duration in milliseconds if not specified in viewport */
const DEFAULT_ANIMATION_DURATION_MS = 300;

/**
 * Calculate animated viewport position considering active animations.
 * Detects viewport changes and initiates animations when feature flag is enabled.
 * Returns interpolated position during animation, or actual position otherwise.
 *
 * @param state - Editor state containing viewport and feature flags
 * @param currentTime - Current time in milliseconds (from performance.now())
 * @param animationState - Current animation state (mutable, managed by caller)
 * @param previousViewport - Previous viewport position (mutable, managed by caller)
 * @returns Effective viewport position (animated or actual)
 */
export function calculateAnimatedViewport(
	state: State,
	currentTime: number,
	animationState: { current: AnimationState | null },
	previousViewport: { x: number; y: number }
): { x: number; y: number } {
	const actualViewport = state.graphicHelper.viewport;

	// Check if viewport has changed and animation flag is enabled
	const viewportChanged = actualViewport.x !== previousViewport.x || actualViewport.y !== previousViewport.y;

	if (viewportChanged && state.featureFlags.viewportAnimations) {
		// Get animation duration from viewport or use default
		const duration = actualViewport.animationDurationMs ?? DEFAULT_ANIMATION_DURATION_MS;

		// Start new animation
		animationState.current = {
			isAnimating: true,
			startViewport: { ...previousViewport },
			targetViewport: { x: actualViewport.x, y: actualViewport.y },
			startTime: currentTime,
			duration,
		};
		previousViewport.x = actualViewport.x;
		previousViewport.y = actualViewport.y;
	} else if (viewportChanged) {
		// Viewport changed but animation disabled - cancel any active animation
		animationState.current = null;
		previousViewport.x = actualViewport.x;
		previousViewport.y = actualViewport.y;
	}

	// Calculate interpolated position if animation is active
	if (animationState.current && animationState.current.isAnimating) {
		const elapsed = currentTime - animationState.current.startTime;
		const progress = Math.min(elapsed / animationState.current.duration, 1.0);

		// Animation complete
		if (progress >= 1.0) {
			animationState.current = null;
			return { x: actualViewport.x, y: actualViewport.y };
		}

		// Interpolate position with easing
		const easedProgress = easeInOutCubic(progress);
		const x = Math.round(
			animationState.current.startViewport.x +
				(animationState.current.targetViewport.x - animationState.current.startViewport.x) * easedProgress
		);
		const y = Math.round(
			animationState.current.startViewport.y +
				(animationState.current.targetViewport.y - animationState.current.startViewport.y) * easedProgress
		);

		return { x, y };
	}

	// No animation - return actual viewport
	return { x: actualViewport.x, y: actualViewport.y };
}
