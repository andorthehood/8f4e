import generateSprite from '@8f4e/sprite-generator';
import { Engine, PostProcessEffect } from '@8f4e/2d-engine';

import { drawArrows, drawCodeBlocks, drawConnections, drawContextMenu, drawDialog, drawInfoOverlay } from './drawers';
import drawBackground from './drawers/drawBackground';

import type { ColorScheme } from '@8f4e/sprite-generator';
import type { State } from '../state/types';

// Cache for loaded color schemes
let colorSchemesCache: Record<string, ColorScheme> | null = null;

export default async function init(
	state: State,
	canvas: HTMLCanvasElement
): Promise<{
	resize: (width: number, height: number) => void;
	reloadSpriteSheet: () => void;
	loadPostProcessEffects: (postProcessEffects: PostProcessEffect[]) => void;
}> {
	// Load color schemes if not already cached
	if (!colorSchemesCache && state.options.loadColorSchemes) {
		try {
			colorSchemesCache = await state.options.loadColorSchemes();
		} catch (error) {
			console.warn('Failed to load color schemes in view:', error);
		}
	}

	const {
		canvas: sprite,
		spriteLookups,
		characterWidth,
		characterHeight,
	} = generateSprite({
		font: state.editorSettings.font || '8x16',
		colorScheme: colorSchemesCache?.[state.editorSettings.colorScheme],
	});

	state.graphicHelper.spriteLookups = spriteLookups;
	state.graphicHelper.globalViewport.hGrid = characterHeight;
	state.graphicHelper.globalViewport.vGrid = characterWidth;

	const engine = new Engine(canvas, { caching: true });

	engine.loadSpriteSheet(sprite);

	engine.render(function (timeToRender, fps, vertices, maxVertices) {
		drawBackground(engine, state);
		drawCodeBlocks(engine, state);
		drawConnections(engine, state);
		if (state.featureFlags.infoOverlay) {
			drawInfoOverlay(engine, state, {
				timeToRender,
				fps,
				vertices,
				maxVertices,
			});
		}
		drawDialog(engine, state);
		drawArrows(engine, state);
		drawContextMenu(engine, state);
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
				colorScheme: colorSchemesCache?.[state.editorSettings.colorScheme],
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
	};
}
