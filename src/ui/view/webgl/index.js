import createShader from './utils/createShader.js';
import createProgram from './utils/createProgram.js';
import vertexShader from './shaders/shader.vert';
import textureShader from './shaders/texture.frag';
import testImage from './textures/test.jpg';
import fontImage from './textures/font.png';

import { drawRectangles, drawLines, loadImage, drawImage, setUniform, drawText, createTexture } from './utils.js';
import { createRectangleBufferFromUiData, createLineBufferFromUiData } from './uiHelper.js';

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
	const image = await loadImage(testImage);
	const font = await loadImage(fontImage);

	const canvas = document.getElementById('glcanvas');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const gl = canvas.getContext('webgl', { antialias: false });

	const program = createProgram(gl, [
		createShader(gl, textureShader, gl.FRAGMENT_SHADER),
		createShader(gl, vertexShader, gl.VERTEX_SHADER),
	]);

	const a_position = gl.getAttribLocation(program, 'a_position');
	const a_texcoord = gl.getAttribLocation(program, 'a_texcoord');
	const texcoordBuffer = gl.createBuffer();
	const positionBuffer = gl.createBuffer();

	window.addEventListener('resize', () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		setUniform(gl, program, 'u_resolution', canvas.width, canvas.height);
	});

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clearColor(0, 0, 0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.useProgram(program);
	setUniform(gl, program, 'u_resolution', canvas.width, canvas.height);

	/// POSITION BUFFER
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

	// BACK TO TEXTCOORD BUFFER
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.vertexAttribPointer(a_texcoord, 2, gl.FLOAT, false, 0, 0);
	let counter = 0;
	let start = Date.now();

	const texture = createTexture(gl, image);
	const fontTexture = createTexture(gl, font);

	const render = () => {
		const now = performance.now();
		gl.clear(gl.COLOR_BUFFER_BIT);
		drawImage(gl, program, positionBuffer, texcoordBuffer, a_position, a_texcoord, texture, 100, 100, 500, 500);
		setUniform(gl, program, 'u_color', 1, 1, 1, 1);
		drawRectangles(gl, createRectangleBufferFromUiData(window.ui));
		setUniform(gl, program, 'u_color', 0.5, 0.5, 0.5, 1);
		drawLines(gl, createLineBufferFromUiData(window.ui));

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
		counter++;

		window.requestAnimationFrame(render);
	};

	window.requestAnimationFrame(render);

	loadWasm();
};

init();
