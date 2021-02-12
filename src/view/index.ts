import { Engine } from './engine';
import generateSprite from './spriteGenerator';
import { drawConnections, drawModules, drawContextMenu } from './drawers';

const init = async function (state) {
	const sprite = await generateSprite();

	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const engine = new Engine(canvas);

	engine.loadSpriteSheet(sprite.canvas);
	engine.setSpriteLookupAlgorithm(sprite.lookupFunction);

	engine.render(function (timeToRender, fps, vertices, maxVertices) {
		engine.resize(window.innerWidth, window.innerHeight);
		drawConnections(engine, state);
		drawModules(engine, state);
		drawContextMenu(engine, state);

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

		//engine.drawSpriteFromCoordinates(200, 200, 220, 120, 0, 0);
	});
};

export default init;
