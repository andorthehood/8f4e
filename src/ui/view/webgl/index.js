import fragmentShader from './shaders/shader.frag';
import vertexShader from './shaders/shader.vert';

import createShader from './utils/createShader';
import createProgram from './utils/createProgram';
import setUniform from './utils/setUniform';

const init = function (vertexShaderCode, fragmentShaderCode) {
	const canvas = document.getElementById('glcanvas');
	const gl = canvas.getContext('webgl', { antialias: false });

	const fragmentShader = createShader(gl, fragmentShaderCode, gl.FRAGMENT_SHADER);
	const vertexShader = createShader(gl, vertexShaderCode, gl.VERTEX_SHADER);

	const program = createProgram(gl, [vertexShader, fragmentShader]);
	gl.useProgram(program);

	var a_position = gl.getAttribLocation(program, 'a_position');

	setUniform(gl, program, 'u_resolution', canvas.width, canvas.height);

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.enableVertexAttribArray(a_position);
	gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.clearColor(0.9, 0.9, 0.9, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

	setUniform(gl, program, 'u_color', 1, 0, 0, 1);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, 1, 10, 10, 10, 10, 1]), gl.STATIC_DRAW);
	gl.drawArrays(gl.LINE_LOOP, 0, 4);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, 1, 15, 15, 15, 15, 1]), gl.STATIC_DRAW);
	gl.drawArrays(gl.LINE_LOOP, 0, 4);
};

init(vertexShader, fragmentShader);
