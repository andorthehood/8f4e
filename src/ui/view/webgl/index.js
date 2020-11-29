import createShader from './utils/createShader.js';
import createProgram from './utils/createProgram.js';
import setUniform from './utils/setUniform.js';

const init = async function () {
	const canvas = document.getElementById('glcanvas');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const gl = canvas.getContext('webgl', { antialias: false });

	const shaderFiles = await Promise.all([fetch('ui/view/webgl/shaders/shader.vert'), fetch('ui/view/webgl/shaders/shader.frag')]);
	const shaderCodes = await Promise.all(shaderFiles.map(response => response.text()));
	const shaders = [createShader(gl, shaderCodes[1], gl.FRAGMENT_SHADER), createShader(gl, shaderCodes[0], gl.VERTEX_SHADER)];
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

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, 1, 10, 10, 10, 10, 1]), gl.STATIC_DRAW);
	gl.drawArrays(gl.LINE_LOOP, 0, 4);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, 1, 15, 15, 15, 15, 1]), gl.STATIC_DRAW);
	gl.drawArrays(gl.LINE_LOOP, 0, 4);
};

init();
