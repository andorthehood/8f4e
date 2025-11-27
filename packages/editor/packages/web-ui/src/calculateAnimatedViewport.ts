import type { State } from '@8f4e/editor-state';

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

interface ViewportLike {
	x: number;
	y: number;
	animationDurationMs?: number;
}

interface ViewportAnimationInput {
	actualViewport: ViewportLike;
	viewportAnimationsEnabled: boolean;
	currentTime: number;
	previousViewport: { x: number; y: number };
	animationState: AnimationState | null;
}

interface ViewportAnimationResult {
	effectiveViewport: { x: number; y: number };
	animationState: AnimationState | null;
	previousViewport: { x: number; y: number };
}

/**
 * Pure helper that calculates the next effective viewport and updated animation state.
 * This function has no side effects and is exported for unit testing.
 */
export function calculateAnimatedViewportState(input: ViewportAnimationInput): ViewportAnimationResult {
	const { actualViewport, viewportAnimationsEnabled, currentTime } = input;
	let { previousViewport, animationState } = input;

	const viewportChanged = actualViewport.x !== previousViewport.x || actualViewport.y !== previousViewport.y;

	if (viewportChanged && viewportAnimationsEnabled) {
		const rawDuration = actualViewport.animationDurationMs ?? DEFAULT_ANIMATION_DURATION_MS;

		// Treat non-positive durations as "no animation" to avoid division by zero/NaN.
		if (rawDuration <= 0) {
			animationState = null;
			previousViewport = { x: actualViewport.x, y: actualViewport.y };

			return {
				effectiveViewport: { x: actualViewport.x, y: actualViewport.y },
				animationState,
				previousViewport,
			};
		}

		animationState = {
			isAnimating: true,
			startViewport: { ...previousViewport },
			targetViewport: { x: actualViewport.x, y: actualViewport.y },
			startTime: currentTime,
			duration: rawDuration,
		};
		previousViewport = { x: actualViewport.x, y: actualViewport.y };
	} else if (viewportChanged) {
		animationState = null;
		previousViewport = { x: actualViewport.x, y: actualViewport.y };
	}

	if (animationState && animationState.isAnimating) {
		const elapsed = currentTime - animationState.startTime;
		const rawProgress = elapsed / animationState.duration;

		// Clamp to [0, 1] and guard against invalid progress values.
		const progress = Number.isFinite(rawProgress) ? Math.min(Math.max(rawProgress, 0), 1) : 1;

		if (progress >= 1) {
			return {
				effectiveViewport: { x: actualViewport.x, y: actualViewport.y },
				animationState: null,
				previousViewport,
			};
		}

		const easedProgress = easeInOutCubic(progress);
		const x = Math.round(
			animationState.startViewport.x +
				(animationState.targetViewport.x - animationState.startViewport.x) * easedProgress
		);
		const y = Math.round(
			animationState.startViewport.y +
				(animationState.targetViewport.y - animationState.startViewport.y) * easedProgress
		);

		return {
			effectiveViewport: { x, y },
			animationState,
			previousViewport,
		};
	}

	return {
		effectiveViewport: { x: actualViewport.x, y: actualViewport.y },
		animationState,
		previousViewport,
	};
}

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
	const {
		effectiveViewport,
		animationState: nextAnimationState,
		previousViewport: nextPreviousViewport,
	} = calculateAnimatedViewportState({
		actualViewport: state.graphicHelper.viewport,
		viewportAnimationsEnabled: state.featureFlags.viewportAnimations,
		currentTime,
		previousViewport,
		animationState: animationState.current,
	});

	animationState.current = nextAnimationState;
	previousViewport.x = nextPreviousViewport.x;
	previousViewport.y = nextPreviousViewport.y;

	return effectiveViewport;
}
