export const createRectangleBuffer = (x, y, width, height) => {
	return [x, y, x + width, y, x + width, y + height, x, y + height];
};

export const drawRectangles = (gl, rectangles) => {
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectangles.flat()), gl.STATIC_DRAW);
	for (let i = 0; i < rectangles.length * 4; i += 4) {
		gl.drawArrays(gl.LINE_LOOP, i, 4);
	}
};
