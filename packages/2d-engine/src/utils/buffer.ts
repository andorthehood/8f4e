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

export const fillBufferWithLineVertices = function (
	buffer: Float32Array,
	offset: number,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	thickness: number = 1
) {
	/*      o (x1, y1)
	 *      |\  Alpha
	 *      | \
	 *      |  \  <-- The hypotenuse here
	 * legA |   \     is the line we want to render.
	 *      |    \
	 *      |     \ Beta
	 *      '----- o (x2, y2)
	 *        legB
	 *
	 *  We need to calculate one of it's angles to be able
	 *  to copy and translate the original line to make it look thicker.
	 */
	const legA = y1 - y2;
	const legB = x1 - x2;
	const alpha = Math.atan(legA / legB);

	/*               |
	 *               |--- o (xA, yA)
	 *               |   /|\ Alpha
	 *               |  / | \
	 *         Beta  | /  |  \
	 *      (x1, y1) |/   |   \
	 * --------------*-)--+----\---->
	 *              /|\         \
	 *             / | \         \
	 *            /  |  \         \
	 *           /   |   \         '
	 * (xD, xD) o-)--+    \          .
	 *           \   |     \
	 *            \  |      '    <-- This is the central line
	 *             \          .      for which we have the cooridnates
	 *              '
	 *                .  <-- This is a slightly translated line
	 */

	thickness = thickness / 2;
	const translateX = Math.max(1, thickness) * Math.sin(alpha);
	const translateY = Math.max(1, thickness) * Math.cos(alpha);

	let xA = x1;
	let yA = y1;
	let xD = x1 + translateX;
	let yD = y1 - translateY;

	let xB = x2;
	let yB = y2;
	let xC = x2 + translateX;
	let yC = y2 - translateY;

	if (thickness >= 1) {
		xA = x1 - translateX;
		yA = y1 + translateY;
		xB = x2 - translateX;
		yB = y2 + translateY;
	}

	// triangle 1 vertex 1
	buffer[offset] = xA;
	buffer[offset + 1] = yA;
	// vertex 2
	buffer[offset + 2] = xB;
	buffer[offset + 3] = yB;
	// vertex 3
	buffer[offset + 4] = xC;
	buffer[offset + 5] = yC;

	// triangle 2 vertex 1
	buffer[offset + 6] = xD;
	buffer[offset + 7] = yD;
	// vertex 2
	buffer[offset + 8] = xA;
	buffer[offset + 9] = yA;
	// vertex 3
	buffer[offset + 10] = xC;
	buffer[offset + 11] = yC;
};
