import * as PIXI from 'pixi.js';
import cursor from '../../../cursor.png';

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

app.loader.add('cursor', cursor).load((loader, resources) => {
	const cursor = new PIXI.Sprite(resources.cursor.texture);

	const rectangles = ui.modules.map(({ size, position, name, connectors = [], isSelected }) => {
		const container = new PIXI.Container();

		const rectangle = new PIXI.Graphics();
		rectangle.lineStyle(1, isSelected ? 0xffff00 : 0xffffff, 1);
		rectangle.drawRect(0, 0, size[0], size[1]);

		connectors.forEach(({ position }) => {
			const rectangle = new PIXI.Graphics();
			rectangle.lineStyle(1, 0xffffff, 1);
			rectangle.drawRect(position[0], position[1], 10, 10);
			container.addChild(rectangle);
		});

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

		return container;
	});

	app.stage.addChild(...rectangles);

	const connections = ui.connections.map(({ from, to }) => {
		const line = new PIXI.Graphics();
		app.stage.addChild(line);
		return line;
	});

	const selectArea = new PIXI.Graphics();
	app.stage.addChild(selectArea);

	app.stage.addChild(cursor);

	app.ticker.add(() => {
		cursor.x = ui.cursor[0];
		cursor.y = ui.cursor[1];

		selectArea.clear();
		selectArea.lineStyle(1, 0xffffff, 0.5);
		selectArea.drawRect(...ui.selectArea);

		rectangles.forEach((rectangle, index) => {
			rectangle.x = ui.modules[index].position[0];
			rectangle.y = ui.modules[index].position[1];
		});

		connections.forEach((connection, index) => {
			connection.clear();
			const { fromModule, fromConnector, toModule, toConnector } = ui.connections[index];
			const a = ui.modules.find(({ id }) => id === fromModule);
			const b = ui.modules.find(({ id }) => id === toModule);
			connection.lineStyle(1, 0xffffff, 1);
			connection.moveTo(
				a.connectors[fromConnector].position[0] + a.position[0] + 5,
				a.connectors[fromConnector].position[1] + a.position[1] + 5
			);
			connection.lineTo(
				b.connectors[toConnector].position[0] + b.position[0] + 5,
				b.connectors[toConnector].position[1] + b.position[1] + 5
			);
		});
	});
});

app.renderer.resize(window.innerWidth, window.innerHeight);
