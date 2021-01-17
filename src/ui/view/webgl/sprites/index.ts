import generateFont from './generateFont';

const generateSprite = async function () {
	const offscreenCanvas = new OffscreenCanvas(256, 256);
	const ctx = offscreenCanvas.getContext('2d');

	generateFont(ctx, 0, 0);

	const blob = await offscreenCanvas.convertToBlob({
		type: 'image/png',
	});
	const src = URL.createObjectURL(blob);

	console.log(src);

	// const image = document.createElement('img');
	// image.src = src;
	// document.body.appendChild(image);

	return offscreenCanvas;
};

export default generateSprite;
