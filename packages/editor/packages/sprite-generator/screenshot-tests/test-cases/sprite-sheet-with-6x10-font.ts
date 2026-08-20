import spriteGenerator from '@8f4e/sprite-generator';

(async () => {
	const canvasElement = document.getElementById('test-canvas') as HTMLCanvasElement;
	const { spriteAtlas } = await spriteGenerator({
		font: '6x10',
	});

	const ctx = canvasElement.getContext('2d');
	if (ctx) {
		const blob = await spriteAtlas.image.convertToBlob();
		const img = new Image();
		const objectURL = URL.createObjectURL(blob);

		img.onload = () => {
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(img, 0, 0);
			URL.revokeObjectURL(objectURL);
		};

		img.src = objectURL;
	}
})();
