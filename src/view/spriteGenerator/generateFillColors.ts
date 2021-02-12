const generateFillColors = function (ctx: OffscreenCanvasRenderingContext2D, offsetX: number, offsetY: number) {
	let lookup = {};

	for (let r = 0; r <= 255; r += 51) {
		for (let g = 0; g <= 255; g += 51) {
			for (let b = 0; b <= 255; b += 51) {
				ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
				const x = offsetX + (r / 51) * 4 + (b / 51) * 24;
				const y = offsetY + (g / 51) * 4;
				ctx.fillRect(x, y, 4, 4);
				lookup['rgb(' + r + ',' + g + ',' + b + ')'] = { x, y, spriteWidth: 4, spriteHeight: 4 };
			}
		}
	}

	return lookup;
};

export default generateFillColors;
