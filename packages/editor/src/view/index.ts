import generateSprite from '@8f4e/sprite-generator';
import { CachedEngine, PostProcessEffect } from '@8f4e/2d-engine';

import { drawArrows, drawCodeBlocks, drawConnections, drawContextMenu, drawDialog, drawInfoOverlay } from './drawers';
import colorSchemes from './colorSchemes';

import type { State } from '../state/types';

export default async function init(
	state: State,
	canvas: HTMLCanvasElement
): Promise<{
	resize: (width: number, height: number) => void;
	reloadSpriteSheet: () => void;
	loadPostProcessEffects: (postProcessEffects: PostProcessEffect[]) => void;
}> {
	const {
		canvas: sprite,
		spriteLookups,
		characterWidth,
		characterHeight,
	} = generateSprite({
		font: state.editorSettings.font || '8x16',
		colorScheme: colorSchemes[state.editorSettings.colorScheme] || colorSchemes['hackerman'],
	});

	state.graphicHelper.spriteLookups = spriteLookups;
	state.graphicHelper.globalViewport.hGrid = characterHeight;
	state.graphicHelper.globalViewport.vGrid = characterWidth;

	const engine = new CachedEngine(canvas);

	engine.loadSpriteSheet(sprite);

	engine.render(function (timeToRender, fps, vertices, maxVertices) {
		engine.setSpriteLookup(spriteLookups.background);

		for (
			let i = 0;
			i < Math.ceil(state.graphicHelper.globalViewport.width / (64 * state.graphicHelper.globalViewport.vGrid));
			i++
		) {
			for (
				let j = 0;
				j < Math.ceil(state.graphicHelper.globalViewport.height / (32 * state.graphicHelper.globalViewport.hGrid));
				j++
			) {
				engine.drawSprite(
					64 * state.graphicHelper.globalViewport.vGrid * i,
					32 * state.graphicHelper.globalViewport.hGrid * j,
					0
				);
			}
		}

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
				colorScheme: colorSchemes[state.editorSettings.colorScheme] || colorSchemes['default'],
			});

			state.graphicHelper.spriteLookups = spriteLookups;
			state.graphicHelper.globalViewport.hGrid = characterHeight;
			state.graphicHelper.globalViewport.vGrid = characterWidth;

			engine.loadSpriteSheet(sprite);
		},
		loadPostProcessEffects: (projectEffects: PostProcessEffect[] = []) => {
			if (projectEffects.length < 1) {
				engine.removeAllPostProcessEffects();
			}

			for (const effect of projectEffects) {
				engine.addPostProcessEffect(effect);
			}
		},
	};
}
