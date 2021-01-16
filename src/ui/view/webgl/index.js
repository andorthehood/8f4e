import { Engine } from './engine/index.ts';
import fontImage from './textures/font.png';
import setUniform from './engine/utils/setUniform.js';
import createTexture from './engine/utils/createTexture.js';

function getGlyphInfo(letter) {
	const code = letter.charCodeAt();
	let posY = 0;
	let posX = 0;

	if (code >= 97 && code <= 122) {
		posX = code - 97;
		posY = 3;
	} else if (code >= 48 && code <= 57) {
		posX = code - 48;
		posY = 0;
	} else if (code >= 65 && code <= 84) {
		posX = code - 65;
		posY = 1;
	} else {
		posX = 0;
		posY = 5;
	}

	return {
		x: (5 + 1) * posX,
		y: (7 + 1) * posY,
		letterHeight: 7,
		letterWidth: 5,
		letterSpacing: 1,
	};
}

const loadImage = async src => {
	return new Promise(resolve => {
		const image = new Image();
		image.src = src;
		image.onload = function () {
			resolve(image);
		};
	});
};

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
	const font = await loadImage(fontImage);

	const canvas = document.getElementById('glcanvas');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const engine = new Engine(canvas);

	const {
		attributes: { a_position, a_texcoord },
		buffers: { texcoordBuffer, positionBuffer },
		program,
		gl,
	} = engine;

	let counter = 0;
	let start = Date.now();

	const fontTexture = createTexture(gl, font);

	engine.loadSpriteSheet(font);

	function drawText(text, posX, posY) {
		for (let i = 0; i < text.length; i++) {
			const { x, y, letterWidth, letterHeight, letterSpacing } = getGlyphInfo(text[i]);
			engine.drawSprite(posX + i * (letterWidth + letterSpacing), posY, x, y, letterWidth, letterHeight);
		}
	}

	engine.render(function () {
		const now = performance.now();

		setUniform(gl, program, 'u_color', 0.5, 0.5, 0.5, 1);

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
		});

		for (let i = 0; i < window.ui.modules.length; i++) {
			drawText(window.ui.modules[i].name, window.ui.modules[i].position[0], window.ui.modules[i].position[1]);
		}

		const time = (Math.round((performance.now() - now) * 100) / 100).toString();
		drawText('time to render one frame ' + time + ' ms', 100, 50);
		drawText('fps: ' + Math.floor(counter / ((Date.now() - start) / 1000)), 100, 70);

		engine.drawSprite(0, 0, 0, 0, 120, 120);

		counter++;
	});
};

init();
