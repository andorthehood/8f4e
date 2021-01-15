import createShader from './utils/createShader.js';
import createProgram from './utils/createProgram.js';
import vertexShader from './shaders/shader.vert';
import textureShader from './shaders/texture.frag';
import setUniform from './utils/setUniform.js';
import { fillBufferWithLineCoordinates } from './utils/buffer.js';

export const setup = function (canvas) {
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

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.vertexAttribPointer(a_texcoord, 2, gl.FLOAT, false, 0, 0);

	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);

	return {
		program,
		gl,
		attributes: {
			a_position,
			a_texcoord,
		},
		buffers: {
			texcoordBuffer,
			positionBuffer,
		},
	};
};

export class Engine {
	constructor(canvas) {
		const { program, gl, attributes, buffers } = setup(canvas);
		this.program = program;
		this.gl = gl;
		this.attributes = attributes;
		this.buffers = buffers;
	}

	render(callback) {
		this.lineBuffer = new Float32Array(1000);
		this.lineBufferCounter = 0;

		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		callback();
		window.requestAnimationFrame(() => {
			this.render(callback);
		});

		this.renderLines();
	}

	drawRectangle(x, y, width, height) {
		fillBufferWithLineCoordinates(this.lineBuffer, this.lineBufferCounter, x, y, x + width, y);
		fillBufferWithLineCoordinates(this.lineBuffer, this.lineBufferCounter + 4, x + width, y, x + width, y + height);
		fillBufferWithLineCoordinates(this.lineBuffer, this.lineBufferCounter + 8, x + width, y + height, x, y + height);
		fillBufferWithLineCoordinates(this.lineBuffer, this.lineBufferCounter + 12, x, y + height, x, y);
		this.lineBufferCounter += 16;
	}

	drawLine(x, y, x2, y2) {
		fillBufferWithLineCoordinates(this.lineBuffer, this.lineBufferCounter, x, y, x2, y2);
		this.lineBufferCounter += 4;
	}

	renderLines() {
		const { gl } = this;
		gl.enableVertexAttribArray(this.attributes.a_position);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.lineBuffer, gl.STATIC_DRAW);
		gl.drawArrays(gl.LINES, 0, this.lineBufferCounter / 2);
	}
}
