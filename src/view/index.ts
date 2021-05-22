import { Engine } from '../../packages/2d-engine/src';
import generateSprite from '../../packages/sprite-generator/src';
import { drawConnections, drawModules, drawContextMenu } from './drawers';
import { font } from '../../packages/sprite-generator/src';
import { State } from '../state/types';

const init = async function (state: State) {
	const sprite = await generateSprite();

	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const engine = new Engine(canvas);

	engine.loadSpriteSheet(sprite);

	engine.render(function (timeToRender, fps, vertices, maxVertices) {
		engine.resize(window.innerWidth, window.innerHeight);

		// if (state.ui.isDebugMode) {
		// 	engine.drawSpriteFromCoordinates(10, 10, 512, 512, 0, 0, 512, 512);
		// }

		drawModules(engine, state);
		drawConnections(engine, state);
		drawContextMenu(engine, state);

		engine.setSpriteLookup(font('small_white'));

		if (state.isDebugMode) {
			engine.startGroup(10, state.viewport.height - 50);
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
};

export default init;
