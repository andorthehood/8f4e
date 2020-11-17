import * as PIXI from 'pixi.js';
import cursor from './cursor.png';

const app = new PIXI.Application({
	autoResize: true,
	resolution: window.devicePixelRatio,
});

app.renderer.view.style.position = 'absolute';
app.renderer.view.style.display = 'block';

document.body.appendChild(app.view);

window.addEventListener('resize', () => {
	app.renderer.resize(window.innerWidth, window.innerHeight);
});

let ui = {
	cursor: [0, 0],
	modules: [
		{
			name: 'Hello',
			position: [10, 10],
			size: [100, 100],
			zIndex: 1,
			draggableArea: [
				[0, 0],
				[100, 20],
			],
			beingDragged: false,
		},
		{
			name: 'Hello2',
			position: [60, 50],
			size: [100, 100],
			zIndex: 1,
			draggableArea: [
				[0, 0],
				[100, 20],
			],
			beingDragged: false,
		},
	],
};

document.addEventListener('mousedown', e => {
	const x = e.clientX;
	const y = e.clientY;

	const draggedModule = ui.modules.find(
		({ position, size }) =>
			x >= position[0] && x <= position[0] + size[0] && y >= position[1] && y <= position[1] + size[1]
	);

	if (draggedModule) {
		draggedModule.beingDragged = true;
	}
});

document.addEventListener('mousemove', e => {
	const x = e.clientX;
	const y = e.clientY;

	const draggedModule = ui.modules.find(({ beingDragged }) => beingDragged);

	if (draggedModule) {
		draggedModule.position[0] += e.movementX;
		draggedModule.position[1] += e.movementY;
	}

	ui.cursor[0] = e.clientX;
	ui.cursor[1] = e.clientY;
});

document.addEventListener('mouseup', e => {
	const draggedModule = ui.modules.find(({ beingDragged }) => beingDragged);

	if (draggedModule) {
		draggedModule.beingDragged = false;
	}
});

app.loader.add('cursor', cursor).load((loader, resources) => {
	const cursor = new PIXI.Sprite(resources.cursor.texture);

	const rectangles = ui.modules.map(({ size, position }) => {
		const rectangle = new PIXI.Graphics();
		rectangle.lineStyle(1, 0xffffff, 1);
		rectangle.drawRect(0, 0, size[0], size[1]);
		rectangle.x = position[0];
		rectangle.y = position[1];
		app.stage.addChild(rectangle);
		return rectangle;
	});

	app.stage.addChild(cursor);

	app.ticker.add(() => {
		cursor.x = ui.cursor[0];
		cursor.y = ui.cursor[1];

		rectangles.forEach((rectangle, index) => {
			rectangle.x = ui.modules[index].position[0];
			rectangle.y = ui.modules[index].position[1];
		});
	});
});

app.renderer.resize(window.innerWidth, window.innerHeight);
