const generateFillColors = function (ctx: OffscreenCanvasRenderingContext2D, x: number, y: number) {
	ctx.fillStyle = 'rgba(255,255,255,255)';
	ctx.fillRect(x, y, 10, 10);
	ctx.fillStyle = 'rgba(0,255,255,255)';
	ctx.fillRect(x + 10, y, 10, 10);
	ctx.fillStyle = 'rgba(255,0,255,255)';
	ctx.fillRect(x + 20, y, 10, 10);
	ctx.fillStyle = 'rgba(255,255,0,255)';
	ctx.fillRect(x + 10, y + 10, 10, 10);
	ctx.fillStyle = 'rgba(127,127,127,255)';
	ctx.fillRect(x + 30, y, 10, 10);

	return {
		white: { x, y, spriteWidth: 10, spriteHeight: 10 },
		cyan: { x: x + 10, y, spriteWidth: 10, spriteHeight: 10 },
		purple: { x: x + 20, y, spriteWidth: 10, spriteHeight: 10 },
		grey: { x: x + 30, y, spriteWidth: 10, spriteHeight: 10 },
	};
};

export default generateFillColors;
