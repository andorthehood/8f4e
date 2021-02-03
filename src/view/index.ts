import { Engine } from './engine';
import generateSprite from './sprites';
import { drawConnections, drawModules, drawContextMenu } from './drawers';

const init = async function (state) {
	const sprite = await generateSprite();

	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const engine = new Engine(canvas);

	engine.loadSpriteSheet(sprite.canvas);
	engine.setSpriteLookupAlgorithm(sprite.lookupFunction);

	engine.render(function (timeToRender, fps, triangles, maxTriangles) {
		//engine.reallocateBuffer(1000);
		engine.resize(window.innerWidth, window.innerHeight);
		drawConnections(engine, state);
		drawModules(engine, state);
		drawContextMenu(engine, state);

		// engine.drawLine(100, 100, 200, 100);
		// engine.drawLine(200, 200, 200, 300);
		// engine.drawLine(400, 400, 440, 500);
		// engine.drawLine(500, 500, 560, 600);

		engine.startGroup(10, state.ui.viewport.height - 50);
		engine.drawText(0, 0, 'Time to render one frame ' + timeToRender + ' ms');
		engine.drawText(0, 20, 'fps ' + fps + '  triangles ' + triangles + '/' + maxTriangles);
		engine.endGroup();

		if (state.ui.error.display) {
			engine.startGroup(5, 5);
			engine.drawText(0, 0, 'Error: ' + state.ui.error.message);
			engine.endGroup();
		}

		//engine.drawSpriteFromCoordinates(200, 200, 220, 120, 0, 0);
	});
};

export default init;
