import createShader from './utils/createShader.js';
import createProgram from './utils/createProgram.js';
import setUniform from './utils/setUniform.js';
import fragmentShader from './shaders/shader.frag';
import vertexShader from './shaders/shader.vert';
import { drawRectangles, createRectangleBuffer } from './utils.js';

const init = async function () {
	const canvas = document.getElementById('glcanvas');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const gl = canvas.getContext('webgl', { antialias: false });

	const shaders = [
		createShader(gl, fragmentShader, gl.FRAGMENT_SHADER),
		createShader(gl, vertexShader, gl.VERTEX_SHADER),
	];
	const program = createProgram(gl, shaders);
	gl.useProgram(program);

	var a_position = gl.getAttribLocation(program, 'a_position');

	window.addEventListener('resize', () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		setUniform(gl, program, 'u_resolution', canvas.width, canvas.height);
	});

	setUniform(gl, program, 'u_resolution', canvas.width, canvas.height);

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.enableVertexAttribArray(a_position);
	gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.clearColor(0, 0, 0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

	setUniform(gl, program, 'u_color', 1, 0, 0, 1);

	drawRectangles(gl, [
		createRectangleBuffer(1, 20, 100, 100),
		createRectangleBuffer(200, 200, 20, 40),
		createRectangleBuffer(202, 202, 20, 40),
	]);
};

init();
