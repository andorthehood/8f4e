import { Engine } from './engine';
import generateSprite, { getGlyphInfo } from './sprites';
import { drawConnections, drawModules } from './drawers';

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

const init = async function () {
	const font = await generateSprite();

	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const engine = new Engine(canvas);

	engine.loadSpriteSheet(font);
	engine.setGlyphLookupAlgorithm(getGlyphInfo);

	engine.render(function (timeToRender, fps, triangles, maxTriangles) {
		drawConnections(engine);
		drawModules(engine);

		engine.drawText(100, 50, 'Time to render one frame ' + timeToRender + ' ms');
		engine.drawText(100, 70, 'fps ' + fps + '  triangles ' + triangles + '/' + maxTriangles);

		engine.drawSprite(200, 200, 220, 120, 0, 0);
	});
};

init();
