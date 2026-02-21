import generateSprite, { type SpriteLookups } from '@8f4e/sprite-generator';
import { Engine, PostProcessEffect, BackgroundEffect } from 'glugglug';

import drawCodeBlocks from './drawers/codeBlocks';
import drawConnections from './drawers/codeBlocks/codeBlockDecorators/connections';
import drawContextMenu from './drawers/contextMenu';
import drawDialog from './drawers/dialog';
import drawInfoOverlay from './drawers/infoOverlay';
import drawModeOverlay from './drawers/modeOverlay';
import drawConsoleOverlay from './drawers/consoleOverlay';
import drawBackground from './drawers/drawBackground';
import { calculateAnimatedViewport, type AnimationState } from './calculateAnimatedViewport';

import type { State } from '@8f4e/editor-state';
import type { MemoryViews } from './types';

// Re-export types
export type { MemoryViews } from './types';
export type { SpriteLookups } from '@8f4e/sprite-generator';

export interface SpriteData {
	canvas: OffscreenCanvas;
	spriteLookups: SpriteLookups;
	characterWidth: number;
	characterHeight: number;
}

export default async function init(
	state: State,
	canvas: HTMLCanvasElement,
	memoryViews: MemoryViews,
	spriteData: SpriteData
): Promise<{
	resize: (width: number, height: number) => void;
	reloadSpriteSheet: () => SpriteData;
	loadPostProcessEffect: (effect: PostProcessEffect | null) => void;
	loadBackgroundEffect: (effect: BackgroundEffect | null) => void;
	clearCache: () => void;
}> {
	// Animation state - local to web-ui, not part of editor-state
	const animationState: { current: AnimationState | null } = { current: null };
	const previousViewport = {
		x: state.viewport.x,
		y: state.viewport.y,
	};

	const engine = new Engine(canvas, { caching: true });

	engine.loadSpriteSheet(spriteData.canvas);

	engine.render(function (timeToRender, fps, vertices, maxVertices) {
		const effectiveViewport = calculateAnimatedViewport(state, performance.now(), animationState, previousViewport);

		const originalViewport = {
			x: state.viewport.x,
			y: state.viewport.y,
		};

		state.viewport.x = effectiveViewport.x;
		state.viewport.y = effectiveViewport.y;

		drawBackground(engine, state);
		if (state.featureFlags.consoleOverlay) {
			drawConsoleOverlay(engine, state);
		}
		if (state.featureFlags.infoOverlay) {
			drawInfoOverlay(engine, state, {
				timeToRender,
				fps,
				vertices,
				maxVertices,
			});
		}
		drawCodeBlocks(engine, state, memoryViews);
		drawConnections(engine, state, memoryViews);
		drawContextMenu(engine, state);
		drawModeOverlay(engine, state);
		drawDialog(engine, state);

		state.viewport.x = originalViewport.x;
		state.viewport.y = originalViewport.y;
	});

	return {
		resize: (width, height) => {
			engine.resize(width, height);
		},
		reloadSpriteSheet: () => {
			const spriteData = generateSprite({
				font: state.compiledEditorConfig.font || '8x16',
				colorScheme: state.colorScheme,
			});

			engine.loadSpriteSheet(spriteData.canvas);
			return spriteData;
		},
		loadPostProcessEffect: (effect: PostProcessEffect | null) => {
			if (effect) {
				engine.setPostProcessEffect(effect);
			} else {
				engine.clearPostProcessEffect();
			}
		},
		loadBackgroundEffect: (effect: BackgroundEffect | null) => {
			if (effect) {
				engine.setBackgroundEffect(effect);
			} else {
				engine.clearBackgroundEffect();
			}
		},
		clearCache: () => {
			engine.clearAllCache();
		},
	};
}
