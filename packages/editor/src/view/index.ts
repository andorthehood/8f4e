import generateSprite, { defaultColorScheme, getColorSchemeWithFallback } from '@8f4e/sprite-generator';
import { Engine, PostProcessEffect } from '@8f4e/2d-engine';

import { drawArrows, drawCodeBlocks, drawConnections, drawContextMenu, drawDialog, drawInfoOverlay } from './drawers';
import drawBackground from './drawers/drawBackground';

import type { ColorScheme } from '@8f4e/sprite-generator';
import type { State } from '../state/types';

// Cache for loaded color schemes
let colorSchemesCache: Record<string, ColorScheme> | null = null;

// Helper function to load color schemes with caching
async function loadColorSchemes(state: State): Promise<Record<string, ColorScheme>> {
	if (colorSchemesCache) {
		return colorSchemesCache;
	}

	try {
		if (state.options.loadColorSchemes) {
			colorSchemesCache = await state.options.loadColorSchemes();
		} else {
			// Fallback: return just the default scheme if no loader is provided
			colorSchemesCache = { default: defaultColorScheme };
		}
		return colorSchemesCache;
	} catch (error) {
		console.warn('Failed to load color schemes, using default:', error);
		colorSchemesCache = { default: defaultColorScheme };
		return colorSchemesCache;
	}
}

export default async function init(
	state: State,
	canvas: HTMLCanvasElement
): Promise<{
	resize: (width: number, height: number) => void;
	reloadSpriteSheet: () => void;
	loadPostProcessEffects: (postProcessEffects: PostProcessEffect[]) => void;
}> {
	// Load color schemes during initialization
	const colorSchemes = await loadColorSchemes(state);

	const {
		canvas: sprite,
		spriteLookups,
		characterWidth,
		characterHeight,
	} = generateSprite({
		font: state.editorSettings.font || '8x16',
		colorScheme: getColorSchemeWithFallback(colorSchemes, state.editorSettings.colorScheme),
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
			// Use cached color schemes for synchronous reload
			const schemes = colorSchemesCache || { default: defaultColorScheme };

			const {
				canvas: sprite,
				spriteLookups,
				characterHeight,
				characterWidth,
			} = generateSprite({
				font: state.editorSettings.font || '8x16',
				colorScheme: getColorSchemeWithFallback(schemes, state.editorSettings.colorScheme),
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
