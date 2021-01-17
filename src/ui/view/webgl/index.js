import { Engine } from './engine/index.ts';
import generateSprite from './sprites/index';

function getGlyphInfo(letter) {
	const code = letter.charCodeAt();
	let posY = 0;
	let posX = 0;

	if (code >= 97 && code <= 122) {
		posX = code - 97;
		posY = 0;
	} else if (code >= 48 && code <= 57) {
		posX = code - 48;
		posY = 2;
	} else if (code >= 65 && code <= 84) {
		posX = code - 65;
		posY = 1;
	} else {
		posX = 0;
		posY = 5;
	}

	return {
		x: (7 + 1) * posX,
		y: (13 + 1) * posY,
		letterHeight: 12,
		letterWidth: 7,
		letterSpacing: 2,
	};
}

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

	const canvas = document.getElementById('glcanvas');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const engine = new Engine(canvas);

	let counter = 0;
	let start = Date.now();

	engine.loadSpriteSheet(font);
	engine.setGlyphLookupAlgorithm(getGlyphInfo);
	engine.setUniform('u_color', 0.5, 0.5, 0.5, 1);

	engine.render(function (triangles, maxTriangles) {
		const now = performance.now();

		ui.connections.forEach(({ fromModule, fromConnector, toModule, toConnector }) => {
			const a = ui.modules.find(({ id }) => id === fromModule);
			const b = ui.modules.find(({ id }) => id === toModule);
			const line = [
				a.connectors[fromConnector].position[0] + a.position[0] + 5,
				a.connectors[fromConnector].position[1] + a.position[1] + 5,
				b.connectors[toConnector].position[0] + b.position[0] + 5,
				b.connectors[toConnector].position[1] + b.position[1] + 5,
			];
			engine.drawLine(...line);
		});

		ui.modules.forEach(({ position, size }) => {
			engine.drawRectangle(...position, ...size);
			engine.drawSprite(...position, ...size, 0, 0);
		});

		for (let i = 0; i < window.ui.modules.length; i++) {
			engine.drawText(window.ui.modules[i].position[0], window.ui.modules[i].position[1], window.ui.modules[i].name);
		}

		const time = (Math.round((performance.now() - now) * 100) / 100).toString();
		engine.drawText(100, 50, ' time to render one frame ' + time + ' ms');
		engine.drawText(
			100,
			70,
			' fps ' + Math.floor(counter / ((Date.now() - start) / 1000)) + '  triangles ' + triangles + '/' + maxTriangles
		);

		engine.drawSprite(200, 200, 120, 120, 0, 0);

		counter++;
	});
};

init();
