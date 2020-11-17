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
			id: 1,
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
			id: 2,
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
		{
			id: 3,
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
	connections: [
		{ from: 1, to: 2 },
		{ from: 2, to: 3 },
	],
};

document.addEventListener('contextmenu', e => {
	e.preventDefault();
	return false;
});

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

	const rectangles = ui.modules.map(({ size, position, name }) => {
		const container = new PIXI.Container();

		const rectangle = new PIXI.Graphics();
		rectangle.lineStyle(1, 0xffffff, 1);
		rectangle.drawRect(0, 0, size[0], size[1]);
		container.addChild(rectangle);

		let style = new PIXI.TextStyle({
			fontFamily: 'monospace',
			fontSize: 12,
			fill: 'white',
			stroke: '#ffffff',
			strokeThickness: 1,
		});

		const message = new PIXI.Text(name, style);
		message.position.x = 10;
		message.position.y = 10;

		container.x = position[0];
		container.y = position[1];
		container.addChild(message);

		app.stage.addChild(container);

		return container;
	});

	const connections = ui.connections.map(({ from, to }) => {
		const line = new PIXI.Graphics();
		const a = ui.modules.find(({ id }) => id === from);
		const b = ui.modules.find(({ id }) => id === to);
		line.lineStyle(1, 0xffffff, 1);
		line.moveTo(a.position[0], a.position[1]);
		line.lineTo(b.position[0], b.position[1]);
		app.stage.addChild(line);

		return line;
	});

	app.stage.addChild(cursor);

	app.ticker.add(() => {
		cursor.x = ui.cursor[0];
		cursor.y = ui.cursor[1];

		rectangles.forEach((rectangle, index) => {
			rectangle.x = ui.modules[index].position[0];
			rectangle.y = ui.modules[index].position[1];
		});

		connections.forEach((connection, index) => {
			connection.clear();
			const { from, to } = ui.connections[index];
			const a = ui.modules.find(({ id }) => id === from);
			const b = ui.modules.find(({ id }) => id === to);
			connection.lineStyle(1, 0xffffff, 1);
			connection.moveTo(a.position[0], a.position[1]);
			connection.lineTo(b.position[0], b.position[1]);
		});
	});
});

app.renderer.resize(window.innerWidth, window.innerHeight);
