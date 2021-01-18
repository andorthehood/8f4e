import {
	createShader,
	createProgram,
	createTexture,
	fillBufferWithLineCoordinates,
	fillBufferWithRectangleVertices,
	fillBufferWithSpriteCoordinates,
} from './utils';
import vertexShader from './shaders/shader.vert';
import textureShader from './shaders/texture.frag';

export class Engine {
	program: WebGLProgram;
	gl: WebGL2RenderingContext;
	attributes: { a_position: any; a_texcoord: any };
	buffers: { positionBuffer: WebGLBuffer; texcoordBuffer: WebGLBuffer };
	lineBuffer: Float32Array;
	lineBufferCounter: number;
	triangleBuffer: Float32Array;
	triangleBufferCounter: number;
	textureCoordinateBuffer: Float32Array;
	textureCoordinateBufferCounter: number;
	spriteSheet: WebGLTexture;
	spriteSheetWidth: number;
	spriteSheetHeight: number;
	frameCounter: number;
	startTime: number;
	lastRenderFinishTime: number;

	spriteLookup: (
		sprite: string
	) => { letterSpacing: number; spriteHeight: number; spriteWidth: number; x: number; y: number };

	constructor(canvas: HTMLCanvasElement) {
		const gl = canvas.getContext('webgl2', { antialias: false });
		this.gl = gl;
		const program = createProgram(gl, [
			createShader(gl, textureShader, gl.FRAGMENT_SHADER),
			createShader(gl, vertexShader, gl.VERTEX_SHADER),
		]);
		this.program = program;

		const a_position = gl.getAttribLocation(program, 'a_position');
		const a_texcoord = gl.getAttribLocation(program, 'a_texcoord');
		const texcoordBuffer = gl.createBuffer();
		const positionBuffer = gl.createBuffer();

		window.addEventListener('resize', () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			this.setUniform('u_resolution', canvas.width, canvas.height);
		});

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clearColor(0, 0, 0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.useProgram(program);
		this.setUniform('u_resolution', canvas.width, canvas.height);

		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
		gl.vertexAttribPointer(a_texcoord, 2, gl.FLOAT, false, 0, 0);

		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);

		this.setUniform('u_color', 0.5, 0.5, 0.5, 1);

		this.program = program;
		this.gl = gl;
		this.attributes = {
			a_position,
			a_texcoord,
		};
		this.buffers = {
			texcoordBuffer,
			positionBuffer,
		};
		this.lineBuffer = new Float32Array(100000);
		this.triangleBuffer = new Float32Array(600000);
		this.textureCoordinateBuffer = new Float32Array(600000);
		this.startTime = Date.now();
		this.frameCounter = 0;
	}

	render(callback: (timeToRender: number, fps: number, triangles: number, maxTriangles: number) => void) {
		const triangles = this.triangleBufferCounter / 6;
		const maxTriangles = Math.floor(this.triangleBuffer.length / 6);
		this.lineBufferCounter = 0;
		this.triangleBufferCounter = 0;
		this.textureCoordinateBufferCounter = 0;

		const fps = Math.floor(this.frameCounter / ((Date.now() - this.startTime) / 1000));
		const timeToRender = Math.round((performance.now() - this.lastRenderFinishTime) * 100) / 100;

		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		callback(timeToRender, fps, triangles, maxTriangles);

		this.renderLines();
		this.renderSprites();

		this.frameCounter++;
		this.lastRenderFinishTime = performance.now();

		window.requestAnimationFrame(() => {
			this.render(callback);
		});
	}

	/**
	 * Fills the line drawing buffer with points of a rectangle.
	 * @param x top left corner X coordinate
	 * @param y top left corner Y coordinate
	 * @param width width of the rectanlge
	 * @param height height of the reactanlge
	 */
	drawRectangle(x: number, y: number, width: number, height: number) {
		fillBufferWithLineCoordinates(this.lineBuffer, this.lineBufferCounter, x, y, x + width, y);
		fillBufferWithLineCoordinates(this.lineBuffer, this.lineBufferCounter + 4, x + width, y, x + width, y + height);
		fillBufferWithLineCoordinates(this.lineBuffer, this.lineBufferCounter + 8, x + width, y + height, x, y + height);
		fillBufferWithLineCoordinates(this.lineBuffer, this.lineBufferCounter + 12, x, y + height, x, y);
		this.lineBufferCounter += 16;
	}

	drawFilledRectangle(x: number, y: number, width: number, height: number) {
		fillBufferWithRectangleVertices(this.triangleBuffer, this.triangleBufferCounter, x, y, width, height);
		this.triangleBufferCounter += 12;
	}

	drawLine(x: number, y: number, x2: number, y2: number) {
		fillBufferWithLineCoordinates(this.lineBuffer, this.lineBufferCounter, x, y, x2, y2);
		this.lineBufferCounter += 4;
	}

	loadSpriteSheet(image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas) {
		this.spriteSheet = createTexture(this.gl, image);
		this.spriteSheetWidth = image.width;
		this.spriteSheetHeight = image.height;
	}

	drawSprite(
		x: number,
		y: number,
		width: number,
		height: number,
		spriteX: number,
		spriteY: number,
		spriteWidth: number = width,
		spriteHeight: number = height
	) {
		fillBufferWithRectangleVertices(this.triangleBuffer, this.triangleBufferCounter, x, y, width, height);
		fillBufferWithSpriteCoordinates(
			this.textureCoordinateBuffer,
			this.textureCoordinateBufferCounter,
			spriteX,
			spriteY,
			spriteWidth,
			spriteHeight,
			this.spriteSheetWidth,
			this.spriteSheetHeight
		);
		this.triangleBufferCounter += 12;
		this.textureCoordinateBufferCounter += 12;
	}

	renderLines() {
		const { gl } = this;
		gl.enableVertexAttribArray(this.attributes.a_position);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.lineBuffer, gl.STATIC_DRAW);
		gl.drawArrays(gl.LINES, 0, this.lineBufferCounter / 2);
	}

	renderSprites() {
		const { gl, program } = this;
		gl.bindTexture(gl.TEXTURE_2D, this.spriteSheet);

		gl.enableVertexAttribArray(this.attributes.a_texcoord);
		gl.enableVertexAttribArray(this.attributes.a_position);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.texcoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.textureCoordinateBuffer, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.triangleBuffer, gl.STATIC_DRAW);

		this.setUniform('u_draw_texture', true);
		gl.drawArrays(gl.TRIANGLES, 0, this.triangleBufferCounter / 2);
		this.setUniform('u_draw_texture', false);

		gl.disableVertexAttribArray(this.attributes.a_texcoord);
		gl.disableVertexAttribArray(this.attributes.a_position);
	}

	setSpriteLookupAlgorithm(spriteLookup) {
		this.spriteLookup = spriteLookup;
	}

	drawText(posX: number, posY: number, text: string, letterSpacing: number = 2) {
		for (let i = 0; i < text.length; i++) {
			const { x, y, spriteWidth, spriteHeight } = this.spriteLookup(text[i]);
			this.drawSprite(posX + i * (spriteWidth + letterSpacing), posY, spriteWidth, spriteHeight, x, y);
		}
	}

	setUniform(name, ...values: any) {
		const location = this.gl.getUniformLocation(this.program, name);
		this.gl['uniform' + values.length + 'f'](location, ...values);
	}
}
