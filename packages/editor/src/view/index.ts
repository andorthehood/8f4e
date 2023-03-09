import generateSprite, { font, background } from '@8f4e/sprite-generator';
import { Engine } from '@8f4e/2d-engine';

import { drawConnections, drawContextMenu, drawModules } from './drawers';

import { State } from '../state/types';

export default async function init(
	state: State,
	canvas: HTMLCanvasElement
): Promise<{ resize: (width: number, height: number) => void }> {
	const sprite = await generateSprite();

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

		// if (state.ui.isDebugMode) {
		// 	engine.drawSpriteFromCoordinates(10, 10, 512, 512, 0, 0, 512, 512);
		// }

		drawModules(engine, state);
		drawConnections(engine, state);
		drawContextMenu(engine, state);

		engine.setSpriteLookup(font('white'));

		if (state.options.isDebugMode) {
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

		if (state.error.display) {
			engine.startGroup(5, 5);
			engine.drawText(0, 0, 'Error: ' + state.error.message);
			engine.endGroup();
		}
	});

	return {
		resize: (width, height) => {
			engine.resize(width, height);
		},
	};
}
