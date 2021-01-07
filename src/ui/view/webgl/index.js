import createShader from './utils/createShader.js';
import createProgram from './utils/createProgram.js';
import setUniform from './utils/setUniform.js';
import fragmentShader from './shaders/shader.frag';
import vertexShader from './shaders/shader.vert';
import textureShader from './shaders/texture.frag';

import { drawRectangles, drawLines, drawTriangles, loadImage, createRectangleBuffer } from './utils.js';
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

function setRectangle(gl, x, y, width, height) {
	var x1 = x;
	var x2 = x + width;
	var y1 = y;
	var y2 = y + height;
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]), gl.STATIC_DRAW);
}

const init = async function () {
	const image = await loadImage();
	const canvas = document.getElementById('glcanvas');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const gl = canvas.getContext('webgl', { antialias: false });

	const program = createProgram(gl, [
		//createShader(gl, fragmentShader, gl.FRAGMENT_SHADER),
		createShader(gl, textureShader, gl.FRAGMENT_SHADER),
		createShader(gl, vertexShader, gl.VERTEX_SHADER),
	]);

	const a_position = gl.getAttribLocation(program, 'a_position');
	const a_texcoord = gl.getAttribLocation(program, 'a_texcoord');
	const texcoordBuffer = gl.createBuffer();
	const positionBuffer = gl.createBuffer();

	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

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
	setRectangle(gl, 0, 0, image.width * 2, image.height);
	gl.enableVertexAttribArray(a_position);
	gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

	// BACK TO TEXTCOORD BUFFER
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.enableVertexAttribArray(a_texcoord);
	gl.vertexAttribPointer(a_texcoord, 2, gl.FLOAT, false, 0, 0);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([
			0.0,
			0.0,
			1.0,
			0.0,
			0.0,
			1.0,
			0.0,
			1.0,
			1.0,
			0.0,
			1.0,
			1.0,
			0.0,
			0.0,
			1.0,
			0.0,
			0.0,
			1.0,
			0.0,
			1.0,
			1.0,
			0.0,
			1.0,
			1.0,
			0.0,
			0.0,
			1.0,
			0.0,
			0.0,
			1.0,
			0.0,
			1.0,
			1.0,
			0.0,
			1.0,
			1.0,
			0.0,
			0.0,
			1.0,
			0.0,
			0.0,
			1.0,
			0.0,
			1.0,
			1.0,
			0.0,
			1.0,
			1.0,
		]),
		gl.STATIC_DRAW
	);

	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const render = () => {
		performance.now();
		gl.clear(gl.COLOR_BUFFER_BIT);
		setUniform(gl, program, 'u_color', 1, 1, 1, 1);
		drawRectangles(gl, createRectangleBufferFromUiData(window.ui));
		setUniform(gl, program, 'u_color', 0.5, 0.5, 0.5, 1);
		drawLines(gl, createLineBufferFromUiData(window.ui));

		window.requestAnimationFrame(render);
	};
	render();

	//window.requestAnimationFrame(render);

	loadWasm();
};

init();
