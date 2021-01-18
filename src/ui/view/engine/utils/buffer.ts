/**
 * Fills a vertex buffer with indices of the specified line.
 * @param buffer
 * @param offset
 * @param x
 * @param y
 * @param x2
 * @param y2
 */
export const fillBufferWithLineCoordinates = function (
	buffer: Float32Array,
	offset: number,
	x: number,
	y: number,
	x2: number,
	y2: number
) {
	// Start point
	buffer[offset] = x;
	buffer[offset + 1] = y;
	// End point
	buffer[offset + 2] = x2;
	buffer[offset + 3] = y2;
};

/**
 * Fills a vertex buffer with vertices of the specified rectangle.
 * @param buffer
 * @param offset
 * @param x
 * @param y
 * @param width
 * @param height
 */
export const fillBufferWithRectangleVertices = function (
	buffer: Float32Array,
	offset: number,
	x: number,
	y: number,
	width: number,
	height: number
) {
	const x1: number = x;
	const x2: number = x + width;
	const y1: number = y;
	const y2: number = y + height;

	// Triangle 1 vertex 1
	buffer[offset] = x1;
	buffer[offset + 1] = y1;
	// vertex 2
	buffer[offset + 2] = x2;
	buffer[offset + 3] = y1;
	// vertex 3
	buffer[offset + 4] = x1;
	buffer[offset + 5] = y2;

	// Triangle 2 vertex 1
	buffer[offset + 6] = x1;
	buffer[offset + 7] = y2;
	// vertex 2
	buffer[offset + 8] = x2;
	buffer[offset + 9] = y1;
	// vertex 3
	buffer[offset + 10] = x2;
	buffer[offset + 11] = y2;
};

/**
 * Fills a texture coordinate buffer with the specified sprite coordinates.
 * @param buffer
 * @param offset
 * @param spriteX
 * @param spriteY
 * @param spriteWidth
 * @param spriteHeight
 * @param spriteSheetWidth
 * @param spriteSheetHeight
 */
export const fillBufferWithSpriteCoordinates = function (
	buffer: Float32Array,
	offset: number,
	spriteX: number,
	spriteY: number,
	spriteWidth: number,
	spriteHeight: number,
	spriteSheetWidth: number,
	spriteSheetHeight: number
) {
	const u1: number = spriteX / spriteSheetWidth;
	const v2: number = (spriteY + spriteHeight) / spriteSheetHeight;
	const u2: number = (spriteX + spriteWidth) / spriteSheetWidth;
	const v1: number = spriteY / spriteSheetHeight;

	buffer[offset + 0] = u1;
	buffer[offset + 1] = v1;
	buffer[offset + 2] = u2;
	buffer[offset + 3] = v1;
	buffer[offset + 4] = u1;
	buffer[offset + 5] = v2;
	buffer[offset + 6] = u1;
	buffer[offset + 7] = v2;
	buffer[offset + 8] = u2;
	buffer[offset + 9] = v1;
	buffer[offset + 10] = u2;
	buffer[offset + 11] = v2;
};
