import { Engine } from '../../packages/2d-engine/src';
import generateSprite from '../../packages/sprite-generator/src';
import { drawConnections, drawModules, drawContextMenu } from './drawers';
import { font } from '../../packages/sprite-generator/src';

const init = async function (state) {
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

		if (state.ui.isDebugMode) {
			engine.startGroup(10, state.ui.viewport.height - 50);
			engine.drawText(0, 0, 'Time to render one frame ' + timeToRender + ' ms');
			engine.drawText(0, 15, 'fps ' + fps + '  vertex buffer ' + vertices + '/' + maxVertices);
			engine.drawText(
				0,
				30,
				'compilation time ' +
					state.ui.compiler.compilationTime +
					' ms  cycle time ' +
					state.ui.compiler.cycleTime +
					' ms  timer accuracy ' +
					state.ui.compiler.timerAccuracy +
					' % '
			);
			engine.endGroup();
		}

		if (state.ui.error.display) {
			engine.startGroup(5, 5);
			engine.drawText(0, 0, 'Error: ' + state.ui.error.message);
			engine.endGroup();
		}
	});
};

export default init;
