import { Engine, LineDrawer, PostProcess, RgbaTextureLayer, ShaderUnderlay } from 'glugglug2';

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
const underlay = new ShaderUnderlay(engine);
underlay.setEffect({
	fragmentShader: `#version 300 es
		precision mediump float;

		in vec2 v_topLeftScreenCoord;
		out vec4 outColor;

		void main() {
			vec3 top = vec3(0.025, 0.055, 0.12);
			vec3 bottom = vec3(0.10, 0.035, 0.13);
			outColor = vec4(mix(top, bottom, v_topLeftScreenCoord.y), 1.0);
		}
	`,
});

const textureLayer = new RgbaTextureLayer(engine);
const texture = textureLayer.uploadRgba8Texture(
	new Uint8Array([124, 58, 237, 255, 14, 165, 233, 255, 249, 115, 22, 230, 20, 184, 166, 180]),
	2,
	2
);
const linearTexture = textureLayer.uploadRgba8Texture(
	new Uint8Array([124, 58, 237, 255, 14, 165, 233, 255, 249, 115, 22, 230, 20, 184, 166, 180]),
	2,
	2,
	{ filter: 'linear' }
);
textureLayer.setDrawCallback(layer => {
	layer.drawTexture(texture, 16, 16, 128, 64, 0.85);
	layer.drawTexture(linearTexture, 108, 8, 44, 24, 0.9);
});

const lines = new LineDrawer(engine, { initialCapacity: 1 });
const postProcess = new PostProcess(engine);
postProcess.setEffect({
	fragmentShader: `#version 300 es
		precision mediump float;

		in vec2 v_textureCoord;
		in vec2 v_topLeftScreenCoord;
		uniform sampler2D u_renderTexture;
		out vec4 outColor;

		void main() {
			vec4 scene = texture(u_renderTexture, v_textureCoord);
			float band = step(0.5, fract(v_topLeftScreenCoord.y * 12.0)) * 0.035;
			outColor = vec4(clamp(scene.rgb * vec3(0.94, 1.0, 0.97) + vec3(0.0, 0.0, band), 0.0, 1.0), scene.a);
		}
	`,
});
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
	lines.drawLine(8, 8, 152, 88, 3, [0.9, 0.95, 1, 1]);
	lines.drawLine(8, 88, 152, 8, 2, [0.15, 0.8, 1, 0.85]);
});

const glError = engine.gl.getError();
if (glError !== engine.gl.NO_ERROR) {
	throw new Error(`Visual regression fixture ended with WebGL error ${glError}.`);
}

document.body.dataset.ready = 'true';
