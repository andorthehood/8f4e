import { Engine } from 'glugglug2';

/** Creates a three-sprite atlas with asymmetric patterns that expose incorrect source rectangles or orientation. */
function createAtlas(): HTMLCanvasElement {
	const atlas = document.createElement('canvas');
	atlas.width = 12;
	atlas.height = 4;
	const context = atlas.getContext('2d');
	if (!context) {
		throw new Error('Could not create the visual-test atlas context.');
	}

	context.fillStyle = '#ef4444';
	context.fillRect(0, 0, 4, 4);
	context.fillStyle = '#7f1d1d';
	context.fillRect(0, 0, 1, 1);
	context.fillRect(3, 3, 1, 1);

	context.fillStyle = '#22c55e';
	context.fillRect(4, 0, 4, 4);
	context.fillStyle = '#14532d';
	context.fillRect(5, 1, 2, 2);

	context.fillStyle = 'rgba(250, 204, 21, 0.6)';
	context.fillRect(8, 0, 4, 4);
	context.clearRect(9, 1, 2, 2);

	return atlas;
}

const canvas = document.querySelector<HTMLCanvasElement>('#output');
if (!canvas) {
	throw new Error('Could not find the visual-test output canvas.');
}

const engine = new Engine(canvas, { initialCapacity: 2 });
engine.setSpriteAtlas(createAtlas(), {
	red: { x: 0, y: 0, spriteWidth: 4, spriteHeight: 4 },
	green: { x: 4, y: 0, spriteWidth: 4, spriteHeight: 4 },
	7: { x: 8, y: 0, spriteWidth: 4, spriteHeight: 4 },
});

// This frame must be completely removed by the next renderFrame call.
engine.renderFrame(() => {
	engine.drawSprite(0, 0, 'red', canvas.width, canvas.height);
});

engine.renderFrame(() => {
	engine.drawSprite(4, 4, 'green');
	engine.drawSprite(12, 12, 'red', 32, 24);
	engine.drawSprite(56, 8, 'green', 40, 32);
	engine.drawSprite(28, 48, 'red', 52, 36);
	engine.drawSprite(52, 60, 'green', 52, 28);
	engine.drawSprite(92, 44, 7, 40, 40);
	engine.drawSprite(108, 36, 7, 40, 40);
});

document.body.dataset.ready = 'true';
