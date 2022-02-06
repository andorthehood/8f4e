import { Engine } from '2d-engine';
import generateSprite from 'sprite-generator';

const init = async function () {
	const sprite = await generateSprite();

	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const engine = new Engine(canvas);

	engine.loadSpriteSheet(sprite);
	//engine.drawSpriteFromCoordinates(10, 10, 512, 512, 0, 0, 512, 512);

	//const mockMemory = new Int32Array([0, 0, 0, 0]);

	//drawModule(engine, {}, {}, () => {}, mockMemory);

	engine.renderVertexBuffer();
};

init();
