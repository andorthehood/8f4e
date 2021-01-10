const cache = {};

export const memoize = (func, cacheKey) => {
	if (cache[cacheKey]) {
		return cache[cacheKey];
	}
	cache[cacheKey] = func();
	return cache[cacheKey];
};

export const createRectangleBuffer = (x, y, width, height) => {
	return [x, y, x + width, y, x + width, y + height, x, y + height];
};

export const createLineBuffer = (x, y, x2, y2) => {
	return [x, y, x2, y2];
};

export const createRectangleFromTriangles = (x, y, width, height) => {
	var x1 = x;
	var x2 = x + width;
	var y1 = y;
	var y2 = y + height;
	return new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]);
};

export const drawRectangles = (gl, rectangles) => {
	gl.bufferData(gl.ARRAY_BUFFER, rectangles, gl.STATIC_DRAW);
	for (let i = 0; i < rectangles.length / 2; i += 4) {
		gl.drawArrays(gl.LINE_LOOP, i, 4);
	}
};

export const drawLines = (gl, linesBuffer) => {
	gl.bufferData(gl.ARRAY_BUFFER, linesBuffer, gl.STATIC_DRAW);
	for (let i = 0; i < linesBuffer.length / 2; i += 2) {
		gl.drawArrays(gl.LINES, i, 2);
	}
};

export const drawRectanglesFromTriangles = (gl, rectangles) => {
	gl.bufferData(gl.ARRAY_BUFFER, rectangles, gl.STATIC_DRAW);
	for (let i = 0; i < rectangles.length / 2; i += 6) {
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
};

export const loadImage = async src => {
	return new Promise(resolve => {
		const image = new Image();
		image.src = src;
		image.onload = function () {
			resolve(image);
		};
	});
};

export const setUniform = function (gl, program, name, ...values) {
	const location = gl.getUniformLocation(program, name);
	gl['uniform' + values.length + 'f'](location, ...values);
};

export const drawImage = (
	gl,
	program,
	positionBuffer,
	texcoordBuffer,
	a_position,
	a_texcoord,
	image,
	x,
	y,
	width,
	height
) => {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.enableVertexAttribArray(a_texcoord);

	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
		gl.STATIC_DRAW
	);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	setUniform(gl, program, 'u_draw_texture', true);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	drawRectanglesFromTriangles(gl, createRectangleFromTriangles(x, y, width, height));

	gl.disableVertexAttribArray(a_texcoord);
	setUniform(gl, program, 'u_draw_texture', false);
};

var fontInfo = {
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

		const x2 = x + letterWidth;
		const y2 = y + letterHeight;
		const u1 = glyphInfo.x / textureWidth;
		const v2 = (glyphInfo.y + letterHeight) / textureHeight;
		const u2 = (glyphInfo.x + letterWidth) / textureWidth;
		const v1 = glyphInfo.y / textureHeight;

		positions[offset + 0] = x;
		positions[offset + 1] = y;
		texcoords[offset + 0] = u1;
		texcoords[offset + 1] = v1;
		positions[offset + 2] = x2;
		positions[offset + 3] = y;
		texcoords[offset + 2] = u2;
		texcoords[offset + 3] = v1;
		positions[offset + 4] = x;
		positions[offset + 5] = y2;
		texcoords[offset + 4] = u1;
		texcoords[offset + 5] = v2;
		positions[offset + 6] = x;
		positions[offset + 7] = y2;
		texcoords[offset + 6] = u1;
		texcoords[offset + 7] = v2;
		positions[offset + 8] = x2;
		positions[offset + 9] = y;
		texcoords[offset + 8] = u2;
		texcoords[offset + 9] = v1;
		positions[offset + 10] = x2;
		positions[offset + 11] = y2;
		texcoords[offset + 10] = u2;
		texcoords[offset + 11] = v2;

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
	var glyphTex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, glyphTex);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, font);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	const vertices = makeVerticesForString(fontInfo, text, x, y);

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices.position, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices.texcoord, gl.STATIC_DRAW);

	gl.enableVertexAttribArray(a_position);
	gl.enableVertexAttribArray(a_texcoord);

	setUniform(gl, program, 'u_draw_texture', true);
	gl.drawArrays(gl.TRIANGLES, 0, vertices.numVertices);
	setUniform(gl, program, 'u_draw_texture', false);
};
