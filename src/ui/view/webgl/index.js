import { Engine } from './engine/index.ts';
import cursorImage from './textures/cursor.png';
import fontImage from './textures/font.png';
import setUniform from './engine/utils/setUniform.js';
import createTexture from './engine/utils/createTexture.js';

import { loadImage, drawText, drawImage } from './utils.js';

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
	const cursor = await loadImage(cursorImage);
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
	const cursorTexture = createTexture(gl, cursor);

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
			drawText(
				gl,
				program,
				positionBuffer,
				texcoordBuffer,
				a_position,
				a_texcoord,
				fontTexture,
				window.ui.modules[i].name,
				window.ui.modules[i].position[0],
				window.ui.modules[i].position[1]
			);
		}

		const time = (Math.round((performance.now() - now) * 100) / 100).toString();
		drawText(
			gl,
			program,
			positionBuffer,
			texcoordBuffer,
			a_position,
			a_texcoord,
			fontTexture,
			'time to render one frame ' + time + ' ms',
			100,
			50
		);
		drawText(
			gl,
			program,
			positionBuffer,
			texcoordBuffer,
			a_position,
			a_texcoord,
			fontTexture,
			'fps: ' + Math.floor(counter / ((Date.now() - start) / 1000)),
			100,
			70
		);

		drawImage(gl, program, positionBuffer, texcoordBuffer, a_position, a_texcoord, cursorTexture, 100, 100, 100, 100);

		counter++;
	});
};

init();
