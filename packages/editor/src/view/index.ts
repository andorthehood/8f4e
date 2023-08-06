import generateSprite from '@8f4e/sprite-generator';
import { Engine } from '@8f4e/2d-engine';

import { drawConnections, drawContextMenu, drawModules, drawDialog, drawArrows } from './drawers';
import colorSchemes from './colorSchemes';

import { State } from '../state/types';

export default async function init(
	state: State,
	canvas: HTMLCanvasElement
): Promise<{ resize: (width: number, height: number) => void; reloadSpriteSheet: () => void }> {
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
	state.graphicHelper.viewport.hGrid = characterHeight;
	state.graphicHelper.viewport.vGrid = characterWidth;

	const engine = new Engine(canvas);

	engine.loadSpriteSheet(sprite);

	engine.render(function (timeToRender, fps, vertices, maxVertices) {
		engine.setSpriteLookup(spriteLookups.background);

		for (
			let i = 0;
			i < Math.ceil(state.graphicHelper.viewport.width / (64 * state.graphicHelper.viewport.vGrid));
			i++
		) {
			for (
				let j = 0;
				j < Math.ceil(state.graphicHelper.viewport.height / (32 * state.graphicHelper.viewport.hGrid));
				j++
			) {
				engine.drawSprite(64 * state.graphicHelper.viewport.vGrid * i, 32 * state.graphicHelper.viewport.hGrid * j, 0);
			}
		}

		drawModules(engine, state);
		drawConnections(engine, state);
		drawArrows(engine, state);
		drawContextMenu(engine, state);

		engine.startGroup(0, state.graphicHelper.viewport.roundedHeight - state.graphicHelper.viewport.hGrid);

		let statusText = ' ';

		if (state.graphicHelper.selectedModule) {
			statusText += '< module: ' + state.graphicHelper.selectedModule.id + ' >';
		}

		1000 / 120;

		statusText += ' sample rate: ' + state.project.sampleRate;
		statusText += ' vertex buffer: ' + Math.round((vertices / maxVertices) * 100) + '%';
		statusText += ' graphic load: ' + (parseInt(timeToRender, 10) / (1000 / 120)) * 100 + '%';

		engine.setSpriteLookup(spriteLookups.fillColors);
		engine.drawSprite(
			0,
			0,
			'background',
			statusText.length * state.graphicHelper.viewport.vGrid,
			state.graphicHelper.viewport.hGrid
		);
		engine.setSpriteLookup(spriteLookups.fontCode);
		engine.drawText(0, 0, statusText);

		engine.endGroup();

		if (state.options.isDebugMode) {
			engine.setSpriteLookup(spriteLookups.fontCode);
			engine.startGroup(10, state.graphicHelper.viewport.height - 50);
			engine.drawText(0, 0, 'Time to render one frame ' + timeToRender + ' ms');
			engine.drawText(0, 15, 'fps ' + fps + '  vertex buffer ' + vertices + '/' + maxVertices);
			engine.drawText(
				0,
				30,
				'compilation time ' +
					state.compiler.compilationTime +
					' ms  cycle time ' +
					state.compiler.cycleTime +
					' ms  timer accuracy ' +
					state.compiler.timerAccuracy +
					' % '
			);
			engine.endGroup();
		}

		drawDialog(engine, state);
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
			state.graphicHelper.viewport.hGrid = characterHeight;
			state.graphicHelper.viewport.vGrid = characterWidth;

			engine.loadSpriteSheet(sprite);
		},
	};
}
