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

var mouseX = 0;
var mouseY = 0;

document.addEventListener('mousemove', e => {
	mouseX = e.clientX;
	mouseY = e.clientY;
});

app.loader.add('cursor', cursor).load((loader, resources) => {
	const cursor = new PIXI.Sprite(resources.cursor.texture);

	app.stage.addChild(cursor);

	app.ticker.add(() => {
		cursor.x = mouseX;
		cursor.y = mouseY;
	});
});

app.renderer.resize(window.innerWidth, window.innerHeight);
