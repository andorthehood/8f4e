import generateSprite, { font, background, fillColor } from '@8f4e/sprite-generator';
import { Engine } from '@8f4e/2d-engine';

import { drawConnections, drawContextMenu, drawModules, drawDialog } from './drawers';
import { HGRID, VGRID } from './drawers/consts';
import colorSchemes from './colorSchemes';

import { State } from '../state/types';

export default async function init(
	state: State,
	canvas: HTMLCanvasElement
): Promise<{ resize: (width: number, height: number) => void; reloadSpriteSheet: () => Promise<void> }> {
	let sprite = await generateSprite({
		colorScheme: colorSchemes[state.editorSettings.colorScheme] || colorSchemes['default'],
	});

	const engine = new Engine(canvas);

	engine.loadSpriteSheet(sprite);

	engine.render(function (timeToRender, fps, vertices, maxVertices) {
		engine.setSpriteLookup(background);
		engine.drawSprite(0, 0, 0);
		engine.drawSprite(32 * 16, 0, 0);
		engine.drawSprite(32 * 16 * 2, 0, 0);
		engine.drawSprite(32 * 16 * 3, 0, 0);
		engine.drawSprite(0, 32 * 16, 0);
		engine.drawSprite(32 * 16, 32 * 16, 0);
		engine.drawSprite(32 * 16 * 2, 32 * 16, 0);
		engine.drawSprite(32 * 16 * 3, 32 * 16, 0);

		drawModules(engine, state);
		drawConnections(engine, state);
		drawContextMenu(engine, state);

		engine.startGroup(0, state.graphicHelper.viewport.roundedHeight - HGRID);

		let statusText = ' ';

		if (state.graphicHelper.selectedModule) {
			statusText += '< module: ' + state.graphicHelper.selectedModule.id + ' >';
		}

		1000 / 120;

		statusText += ' sample rate: ' + state.project.sampleRate;
		statusText += ' vertex buffer: ' + Math.round((vertices / maxVertices) * 100) + '%';
		statusText += ' graphic load: ' + (parseInt(timeToRender, 10) / (1000 / 120)) * 100 + '%';

		engine.setSpriteLookup(fillColor);
		engine.drawSprite(0, 0, 'background', statusText.length * VGRID, HGRID);
		engine.setSpriteLookup(font('code'));
		engine.drawText(0, 0, statusText);

		engine.endGroup();

		if (state.options.isDebugMode) {
			engine.setSpriteLookup(font('code'));
			engine.startGroup(10, state.project.viewport.height - 50);
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
		reloadSpriteSheet: async () => {
			sprite = await generateSprite({
				colorScheme: colorSchemes[state.editorSettings.colorScheme] || colorSchemes['default'],
			});
			engine.loadSpriteSheet(sprite);
		},
	};
}
