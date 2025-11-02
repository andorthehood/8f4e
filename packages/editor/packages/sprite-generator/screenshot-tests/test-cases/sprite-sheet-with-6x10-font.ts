import spriteGenerator from '@8f4e/sprite-generator';

(async function () {
	const canvasElement = document.getElementById('test-canvas') as HTMLCanvasElement;
	const { canvas, spriteLookups } = spriteGenerator({
		font: '6x10',
	});

	void spriteLookups;

	const ctx = canvasElement.getContext('2d');
	if (ctx) {
		const blob = await canvas.convertToBlob();
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
