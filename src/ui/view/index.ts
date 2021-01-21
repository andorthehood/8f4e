import { Engine } from './engine';
import generateSprite from './sprites';
import { drawConnections, drawModules, drawContextMenu } from './drawers';

const loadWasm = async () => {
	const importObject = {
		module: {},
		env: {
			puts: function () {},
			__memory_base: 0,
			memory: new WebAssembly.Memory({ initial: 8 }),
		},
	};

	const module = await WebAssembly.instantiateStreaming(fetch('/test.wasm'), importObject);
};

const init = async function (state) {
	const sprite = await generateSprite();

	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const engine = new Engine(canvas);

	engine.loadSpriteSheet(sprite.canvas);
	engine.setSpriteLookupAlgorithm(sprite.lookupFunction);

	engine.render(function (timeToRender, fps, triangles, maxTriangles) {
		engine.resize(window.innerWidth, window.innerHeight);
		drawConnections(engine, state);
		drawModules(engine, state);
		drawContextMenu(engine, state);

		engine.startGroup(10, state.ui.viewport.height - 50);
		engine.drawText(0, 0, 'Time to render one frame ' + timeToRender + ' ms');
		engine.drawText(0, 20, 'fps ' + fps + '  triangles ' + triangles + '/' + maxTriangles);
		engine.endGroup();

		if (state.ui.error.display) {
			engine.startGroup(5, 5);
			engine.drawText(0, 0, 'Error: ' + state.ui.error.message);
			engine.endGroup();
		}

		// engine.drawSpriteFromCoordinates(200, 200, 220, 120, 0, 0);
		// engine.drawSprite(200, 300, 'cyan', 10, 10);
		// engine.drawSprite(200, 310, 'cyan', 10, 10);
		// engine.drawSprite(220, 300, 'purple', 20, 20);

		// engine.drawSprite(200, 330, 'a', 20, 20);
	});
};

export default init;
