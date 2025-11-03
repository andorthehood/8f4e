import generateSprite from '@8f4e/sprite-generator';
import { Engine, PostProcessEffect } from 'glugglug';

import { drawArrows, drawCodeBlocks, drawConnections, drawContextMenu, drawDialog, drawInfoOverlay } from './drawers';
import drawBackground from './drawers/drawBackground';

import type { State } from '@8f4e/editor-state';

/**
 * Animation state for viewport transitions.
 * Kept local to web-ui package - editor-state remains unaware of animations.
 */
interface AnimationState {
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

/** Animation duration in milliseconds for viewport transitions */
const ANIMATION_DURATION_MS = 300;

export default async function init(
	state: State,
	canvas: HTMLCanvasElement
): Promise<{
	resize: (width: number, height: number) => void;
	reloadSpriteSheet: () => void;
	loadPostProcessEffects: (postProcessEffects: PostProcessEffect[]) => void;
	clearCache: () => void;
}> {
	// Animation state - local to web-ui, not part of editor-state
	let animationState: AnimationState | null = null;
	let previousViewport = {
		x: state.graphicHelper.activeViewport.viewport.x,
		y: state.graphicHelper.activeViewport.viewport.y,
	};

	/**
	 * Calculate effective viewport position considering animations.
	 * Detects viewport changes and initiates animations when feature flag is enabled.
	 * Returns interpolated position during animation, or actual position otherwise.
	 */
	function calculateEffectiveViewport(currentTime: number): { x: number; y: number } {
		const actualViewport = state.graphicHelper.activeViewport.viewport;

		// Check if viewport has changed and animation flag is enabled
		const viewportChanged = actualViewport.x !== previousViewport.x || actualViewport.y !== previousViewport.y;

		if (viewportChanged && state.featureFlags.viewportAnimations) {
			// Start new animation
			animationState = {
				isAnimating: true,
				startViewport: { ...previousViewport },
				targetViewport: { x: actualViewport.x, y: actualViewport.y },
				startTime: currentTime,
				duration: ANIMATION_DURATION_MS,
			};
			previousViewport = { x: actualViewport.x, y: actualViewport.y };
		} else if (viewportChanged) {
			// Viewport changed but animation disabled - cancel any active animation
			animationState = null;
			previousViewport = { x: actualViewport.x, y: actualViewport.y };
		}

		// Calculate interpolated position if animation is active
		if (animationState && animationState.isAnimating) {
			const elapsed = currentTime - animationState.startTime;
			const progress = Math.min(elapsed / animationState.duration, 1.0);

			// Animation complete
			if (progress >= 1.0) {
				animationState = null;
				return { x: actualViewport.x, y: actualViewport.y };
			}

			// Interpolate position with easing
			const easedProgress = easeInOutCubic(progress);
			const x =
				animationState.startViewport.x +
				(animationState.targetViewport.x - animationState.startViewport.x) * easedProgress;
			const y =
				animationState.startViewport.y +
				(animationState.targetViewport.y - animationState.startViewport.y) * easedProgress;

			return { x, y };
		}

		// No animation - return actual viewport
		return { x: actualViewport.x, y: actualViewport.y };
	}

	const {
		canvas: sprite,
		spriteLookups,
		characterWidth,
		characterHeight,
	} = generateSprite({
		font: state.editorSettings.font || '8x16',
		colorScheme: state.colorSchemes[state.editorSettings.colorScheme],
	});

	state.graphicHelper.spriteLookups = spriteLookups;
	state.graphicHelper.globalViewport.hGrid = characterHeight;
	state.graphicHelper.globalViewport.vGrid = characterWidth;

	const engine = new Engine(canvas, { caching: true });

	engine.loadSpriteSheet(sprite);

	engine.render(function (timeToRender, fps, vertices, maxVertices) {
		// Get effective viewport (possibly animated)
		const effectiveViewport = calculateEffectiveViewport(performance.now());

		// Create a render-time view of state with animated viewport
		// This doesn't mutate the original state - it creates a derived object
		// The animation position/delta is kept entirely in web-ui
		const renderState = Object.create(state) as State;
		renderState.graphicHelper = Object.create(state.graphicHelper);
		renderState.graphicHelper.activeViewport = Object.create(state.graphicHelper.activeViewport);
		renderState.graphicHelper.activeViewport.viewport = effectiveViewport;

		// Render with animated viewport (original state unchanged)
		drawBackground(engine, renderState);
		drawCodeBlocks(engine, renderState);
		drawConnections(engine, renderState);
		if (state.featureFlags.infoOverlay) {
			drawInfoOverlay(engine, renderState, {
				timeToRender,
				fps,
				vertices,
				maxVertices,
			});
		}
		drawDialog(engine, renderState);
		drawArrows(engine, renderState);
		drawContextMenu(engine, renderState);
	});

	return {
		resize: (width, height) => {
			engine.resize(width, height);
		},
		reloadSpriteSheet: () => {
			const {
				canvas: sprite,
				spriteLookups,
				characterHeight,
				characterWidth,
			} = generateSprite({
				font: state.editorSettings.font || '8x16',
				colorScheme: state.colorSchemes[state.editorSettings.colorScheme],
			});

			state.graphicHelper.spriteLookups = spriteLookups;
			state.graphicHelper.globalViewport.hGrid = characterHeight;
			state.graphicHelper.globalViewport.vGrid = characterWidth;

			engine.loadSpriteSheet(sprite);
		},
		loadPostProcessEffects: (projectEffects: PostProcessEffect[] = []) => {
			engine.removeAllPostProcessEffects();

			for (const effect of projectEffects) {
				engine.addPostProcessEffect(effect);
			}
		},
		clearCache: () => {
			engine.clearAllCache();
		},
	};
}
