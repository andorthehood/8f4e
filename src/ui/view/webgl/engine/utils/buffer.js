export const fillBufferWithLineCoordinates = function (buffer, offset, x, y, x2, y2) {
	buffer[offset] = x;
	buffer[offset + 1] = y;
	buffer[offset + 2] = x2;
	buffer[offset + 3] = y2;
};
