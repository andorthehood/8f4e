import { afterEach, describe, expect, it, vi } from 'vitest';

import { Engine } from './engine.ts';

type FakeWebGl = ReturnType<typeof createFakeWebGl>;

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('Engine', () => {
	it('uploads one ordered instance range and renders it with one instanced draw', () => {
		const { engine, webgl } = createEngine();
		engine.setSpriteAtlas(createAtlasImage(), {
			player: { x: 0, y: 0, spriteWidth: 8, spriteHeight: 16 },
			enemy: { x: 8, y: 0, spriteWidth: 12, spriteHeight: 10 },
		});
		webgl.bufferSubData.mockClear();
		webgl.drawArraysInstanced.mockClear();
		webgl.texImage2D.mockClear();

		engine.renderFrame(() => {
			engine.drawSprite(10, 20, 'player');
			engine.drawSprite(30, 40, 'enemy', 50, 60);
		});

		expect(webgl.bufferSubData).toHaveBeenCalledTimes(1);
		const bytes = webgl.bufferSubData.mock.calls[0][2] as Uint8Array;
		const floats = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
		const integers = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
		expect(bytes.byteLength).toBe(40);
		expect(Array.from(floats.slice(0, 4))).toEqual([10, 20, 8, 16]);
		expect(integers[4]).toBe(0);
		expect(Array.from(floats.slice(5, 9))).toEqual([30, 40, 50, 60]);
		expect(integers[9]).toBe(1);
		expect(webgl.drawArraysInstanced).toHaveBeenCalledTimes(1);
		expect(webgl.drawArraysInstanced).toHaveBeenCalledWith(webgl.TRIANGLE_STRIP, 0, 4, 2);
		expect(webgl.texImage2D).not.toHaveBeenCalled();
	});

	it('accepts numeric sprite ids', () => {
		const { engine, webgl } = createEngine();
		engine.setSpriteAtlas(createAtlasImage(), {
			7: { x: 0, y: 0, spriteWidth: 4, spriteHeight: 5 },
		});

		engine.renderFrame(() => {
			engine.drawSprite(1, 2, 7);
		});
		expect(webgl.drawArraysInstanced).toHaveBeenLastCalledWith(webgl.TRIANGLE_STRIP, 0, 4, 1);
	});

	it('keeps atlas replacement outside frames', () => {
		const { engine } = createEngine();
		const image = createAtlasImage();
		const lookup = { player: { x: 0, y: 0, spriteWidth: 8, spriteHeight: 8 } };
		engine.setSpriteAtlas(image, lookup);

		expect(() =>
			engine.renderFrame(() => {
				engine.setSpriteAtlas(image, lookup);
			})
		).toThrow('cannot be replaced while a frame is being built');

		expect(() => engine.renderFrame(() => engine.drawSprite(0, 0, 'player'))).not.toThrow();
	});

	it('grows and reuses the same GPU buffer object', () => {
		const { engine, webgl } = createEngine(1);
		engine.setSpriteAtlas(createAtlasImage(), {
			player: { x: 0, y: 0, spriteWidth: 8, spriteHeight: 8 },
		});
		webgl.bufferData.mockClear();

		engine.renderFrame(() => {
			engine.drawSprite(0, 0, 'player');
			engine.drawSprite(10, 0, 'player');
		});

		expect(webgl.createBuffer).toHaveBeenCalledTimes(1);
		expect(webgl.bufferData).toHaveBeenCalledTimes(1);
		expect(webgl.bufferData).toHaveBeenCalledWith(webgl.ARRAY_BUFFER, 40, webgl.DYNAMIC_DRAW);
	});

	it('atomically replaces atlas resources and explicit resize updates the drawing buffer', () => {
		const { canvas, engine, webgl } = createEngine();
		engine.setSpriteAtlas(createAtlasImage(), {
			first: { x: 0, y: 0, spriteWidth: 8, spriteHeight: 8 },
		});
		webgl.deleteTexture.mockClear();
		engine.setSpriteAtlas(createAtlasImage(), {
			second: { x: 8, y: 8, spriteWidth: 8, spriteHeight: 8 },
		});

		expect(webgl.deleteTexture).toHaveBeenCalledTimes(2);
		engine.resize(640, 360);
		expect(canvas.width).toBe(640);
		expect(canvas.height).toBe(360);
		expect(webgl.viewport).toHaveBeenLastCalledWith(0, 0, 640, 360);
	});

	it('owns one requestAnimationFrame loop and destroys resources idempotently', () => {
		const requestAnimationFrame = vi.fn(() => 23);
		const cancelAnimationFrame = vi.fn();
		vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
		vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);
		const { engine, webgl } = createEngine();
		const callback = vi.fn();

		engine.render(callback);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
		expect(() => engine.render(callback)).toThrow('already running');

		engine.destroy();
		engine.destroy();
		expect(cancelAnimationFrame).toHaveBeenCalledOnce();
		expect(cancelAnimationFrame).toHaveBeenCalledWith(23);
		expect(webgl.deleteBuffer).toHaveBeenCalledOnce();
		expect(webgl.deleteVertexArray).toHaveBeenCalledOnce();
		expect(webgl.deleteProgram).toHaveBeenCalledOnce();
		expect(() => engine.renderFrame(callback)).toThrow('engine has been destroyed');
	});
});

function createEngine(initialCapacity = 4): {
	canvas: HTMLCanvasElement;
	engine: Engine;
	webgl: FakeWebGl;
} {
	const webgl = createFakeWebGl();
	const canvas = {
		width: 320,
		height: 200,
		getContext: vi.fn(() => webgl),
	} as unknown as HTMLCanvasElement;
	return { canvas, engine: new Engine(canvas, { initialCapacity }), webgl };
}

function createAtlasImage(): HTMLCanvasElement {
	return { width: 64, height: 64 } as HTMLCanvasElement;
}

function createFakeWebGl() {
	let resourceId = 0;
	const resource = (kind: string) => ({ kind, id: ++resourceId });
	return {
		VERTEX_SHADER: 0x8b31,
		FRAGMENT_SHADER: 0x8b30,
		COMPILE_STATUS: 0x8b81,
		LINK_STATUS: 0x8b82,
		ARRAY_BUFFER: 0x8892,
		DYNAMIC_DRAW: 0x88e8,
		FLOAT: 0x1406,
		UNSIGNED_INT: 0x1405,
		TEXTURE_2D: 0x0de1,
		TEXTURE0: 0x84c0,
		TEXTURE1: 0x84c1,
		RGBA8: 0x8058,
		RGBA: 0x1908,
		UNSIGNED_BYTE: 0x1401,
		UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
		TEXTURE_MIN_FILTER: 0x2801,
		TEXTURE_MAG_FILTER: 0x2800,
		TEXTURE_WRAP_S: 0x2802,
		TEXTURE_WRAP_T: 0x2803,
		NEAREST: 0x2600,
		CLAMP_TO_EDGE: 0x812f,
		RGBA16UI: 0x8d76,
		RGBA_INTEGER: 0x8d99,
		UNSIGNED_SHORT: 0x1403,
		MAX_TEXTURE_SIZE: 0x0d33,
		COLOR_BUFFER_BIT: 0x4000,
		BLEND: 0x0be2,
		ONE: 1,
		ONE_MINUS_SRC_ALPHA: 0x0303,
		TRIANGLE_STRIP: 0x0005,
		createShader: vi.fn(() => resource('shader')),
		shaderSource: vi.fn(),
		compileShader: vi.fn(),
		getShaderParameter: vi.fn(() => true),
		getShaderInfoLog: vi.fn(() => null),
		deleteShader: vi.fn(),
		createProgram: vi.fn(() => resource('program')),
		attachShader: vi.fn(),
		linkProgram: vi.fn(),
		getProgramParameter: vi.fn(() => true),
		getProgramInfoLog: vi.fn(() => null),
		deleteProgram: vi.fn(),
		createBuffer: vi.fn(() => resource('buffer')),
		deleteBuffer: vi.fn(),
		createVertexArray: vi.fn(() => resource('vertex-array')),
		deleteVertexArray: vi.fn(),
		createTexture: vi.fn(() => resource('texture')),
		deleteTexture: vi.fn(),
		getUniformLocation: vi.fn((_program: unknown, name: string) => ({ name })),
		useProgram: vi.fn(),
		bindVertexArray: vi.fn(),
		bindBuffer: vi.fn(),
		bufferData: vi.fn(),
		bufferSubData: vi.fn(),
		enableVertexAttribArray: vi.fn(),
		vertexAttribPointer: vi.fn(),
		vertexAttribIPointer: vi.fn(),
		vertexAttribDivisor: vi.fn(),
		uniform1i: vi.fn(),
		uniform2f: vi.fn(),
		viewport: vi.fn(),
		clearColor: vi.fn(),
		enable: vi.fn(),
		blendFunc: vi.fn(),
		clear: vi.fn(),
		getParameter: vi.fn(() => 4_096),
		activeTexture: vi.fn(),
		bindTexture: vi.fn(),
		pixelStorei: vi.fn(),
		texImage2D: vi.fn(),
		texParameteri: vi.fn(),
		drawArraysInstanced: vi.fn(),
	} as unknown as WebGL2RenderingContext & {
		[key: string]: ReturnType<typeof vi.fn> | number;
	};
}
