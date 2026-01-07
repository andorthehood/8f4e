import generateSprite from '@8f4e/sprite-generator';
import { Engine, PostProcessEffect } from 'glugglug';

import drawCodeBlocks from './drawers/codeBlocks';
import drawConnections from './drawers/codeBlocks/codeBlockDecorators/connections';
import drawContextMenu from './drawers/contextMenu';
import drawDialog from './drawers/dialog';
import drawInfoOverlay from './drawers/infoOverlay';
import drawConsoleOverlay from './drawers/consoleOverlay';
import drawBackground from './drawers/drawBackground';
import { calculateAnimatedViewport, type AnimationState } from './calculateAnimatedViewport';
import { createMemoryViewManager } from './memoryViewManager';

import type { MemoryRef } from './types';
import type { State } from '@8f4e/editor-state';

// Re-export types
export type { MemoryRef, MemoryViews } from './types';

export default async function init(
	state: State,
	canvas: HTMLCanvasElement,
	memoryRef: MemoryRef
): Promise<{
	resize: (width: number, height: number) => void;
	reloadSpriteSheet: () => void;
	loadPostProcessEffects: (postProcessEffects: PostProcessEffect[]) => void;
	clearCache: () => void;
}> {
	// Animation state - local to web-ui, not part of editor-state
	const animationState: { current: AnimationState | null } = { current: null };
	const previousViewport = {
		x: state.graphicHelper.viewport.x,
		y: state.graphicHelper.viewport.y,
	};

	// Memory view manager - creates typed array views from the memory ref
	const getMemoryViews = createMemoryViewManager(memoryRef);

	const {
		canvas: sprite,
		spriteLookups,
		characterWidth,
		characterHeight,
	} = generateSprite({
		font: state.editorSettings.font || '8x16',
		colorScheme: state.colorScheme,
	});

	state.graphicHelper.spriteLookups = spriteLookups;
	state.graphicHelper.viewport.hGrid = characterHeight;
	state.graphicHelper.viewport.vGrid = characterWidth;

	const engine = new Engine(canvas, { caching: true });

	engine.loadSpriteSheet(sprite);

	engine.render(function (timeToRender, fps, vertices, maxVertices) {
		const effectiveViewport = calculateAnimatedViewport(state, performance.now(), animationState, previousViewport);

		const originalViewport = {
			x: state.graphicHelper.viewport.x,
			y: state.graphicHelper.viewport.y,
		};

		state.graphicHelper.viewport.x = effectiveViewport.x;
		state.graphicHelper.viewport.y = effectiveViewport.y;

		// Get memory views - recreated only if buffer identity changed
		const memoryViews = getMemoryViews();

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
		drawDialog(engine, state);
		drawContextMenu(engine, state);

		state.graphicHelper.viewport.x = originalViewport.x;
		state.graphicHelper.viewport.y = originalViewport.y;
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
				colorScheme: state.colorScheme,
			});

			state.graphicHelper.spriteLookups = spriteLookups;
			state.graphicHelper.viewport.hGrid = characterHeight;
			state.graphicHelper.viewport.vGrid = characterWidth;

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
