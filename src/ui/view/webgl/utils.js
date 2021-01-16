import setUniform from './engine/utils/setUniform.js';
import { fillBufferWithRectangleVertices, fillBufferWithSpriteCoordinates } from './engine/utils/buffer.ts';

export const loadImage = async src => {
	return new Promise(resolve => {
		const image = new Image();
		image.src = src;
		image.onload = function () {
			resolve(image);
		};
	});
};

export const drawImage = (
	gl,
	program,
	positionBuffer,
	texcoordBuffer,
	a_position,
	a_texcoord,
	texture,
	x,
	y,
	width,
	height
) => {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.enableVertexAttribArray(a_texcoord);
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
		gl.STATIC_DRAW
	);

	setUniform(gl, program, 'u_draw_texture', true);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const buffer = new Float32Array(12);
	fillBufferWithRectangleVertices(buffer, 0, x, y, width, height);
	gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.disableVertexAttribArray(a_texcoord);
	setUniform(gl, program, 'u_draw_texture', false);
};

const fontInfo = {
	letterHeight: 7,
	letterWidth: 5,
	letterSpacing: 1,
	textureWidth: 120,
	textureHeight: 120,
};

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
	} else {
		posX = 0;
		posY = 5;
	}

	return {
		x: (5 + 1) * posX,
		y: (7 + 1) * posY,
	};
}

function makeVerticesForString({ textureWidth, textureHeight, letterHeight, letterWidth, letterSpacing }, s, x, y) {
	const numVertices = s.length * 6;
	const positions = new Float32Array(numVertices * 2);
	const texcoords = new Float32Array(numVertices * 2);
	let offset = 0;
	for (let i = 0; i < s.length; ++i) {
		const glyphInfo = getGlyphInfo(s[i]);
		fillBufferWithRectangleVertices(positions, offset, x, y, letterWidth, letterHeight);
		fillBufferWithSpriteCoordinates(
			texcoords,
			offset,
			glyphInfo.x,
			glyphInfo.y,
			letterWidth,
			letterHeight,
			textureWidth,
			textureHeight
		);
		x += letterWidth + letterSpacing;
		offset += 12;
	}

	return {
		position: new Float32Array(positions.buffer, 0, offset),
		texcoord: new Float32Array(texcoords.buffer, 0, offset),
		numVertices: offset / 2,
	};
}

export const drawText = (gl, program, positionBuffer, texcoordBuffer, a_position, a_texcoord, font, text, x, y) => {
	gl.bindTexture(gl.TEXTURE_2D, font);
	const vertices = makeVerticesForString(fontInfo, text, x, y);

	gl.enableVertexAttribArray(a_position);
	gl.enableVertexAttribArray(a_texcoord);

	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices.texcoord, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices.position, gl.STATIC_DRAW);

	setUniform(gl, program, 'u_draw_texture', true);
	gl.drawArrays(gl.TRIANGLES, 0, vertices.numVertices);
	setUniform(gl, program, 'u_draw_texture', false);

	gl.disableVertexAttribArray(a_texcoord);
};
