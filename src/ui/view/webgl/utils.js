import { resolveConfig } from 'prettier';

export const createRectangleBuffer = (x, y, width, height) => {
	return [x, y, x + width, y, x + width, y + height, x, y + height];
};

export const createLineBuffer = (x, y, x2, y2) => {
	return [x, y, x2, y2];
};

export const drawRectangles = (gl, rectangles) => {
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectangles.flat()), gl.STATIC_DRAW);
	for (let i = 0; i < rectangles.length * 4; i += 4) {
		gl.drawArrays(gl.LINE_LOOP, i, 4);
	}
};

export const drawLines = (gl, lines) => {
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines.flat()), gl.STATIC_DRAW);
	for (let i = 0; i < lines.length * 2; i += 2) {
		gl.drawArrays(gl.LINES, i, 2);
	}
};

export const drawTriangles = (gl, triangles) => {
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles), gl.STATIC_DRAW);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
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
