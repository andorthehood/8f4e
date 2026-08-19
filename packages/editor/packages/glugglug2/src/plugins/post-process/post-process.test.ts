import { describe, expect, it } from 'vitest';

import { createPluginHost } from '../__tests__/fake-webgl.ts';
import { PostProcess } from './post-process.ts';

const fragmentShader = `#version 300 es
	precision mediump float;
	in vec2 v_textureCoord;
	uniform sampler2D u_renderTexture;
	uniform float u_time;
	uniform vec2 u_resolution;
	out vec4 outColor;
	void main() { outColor = texture(u_renderTexture, v_textureCoord); }
`;

describe('PostProcess', () => {
	it('does no capture work while inactive and processes the completed frame while active', () => {
		const { gl, hooks } = createPluginHost();
		const postProcess = new PostProcess({ gl, hooks });
		expect(hooks.postDraw).toHaveLength(1);

		hooks.postDraw[0](gl);
		expect(gl.createTexture).not.toHaveBeenCalled();
		expect(gl.copyTexSubImage2D).not.toHaveBeenCalled();

		postProcess.setEffect({ fragmentShader });
		hooks.postDraw[0](gl);
		expect(gl.texImage2D).toHaveBeenCalledOnce();
		expect(gl.texImage2D).toHaveBeenCalledWith(gl.TEXTURE_2D, 0, gl.RGB8, 320, 200, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
		expect(gl.copyTexSubImage2D).toHaveBeenCalledWith(gl.TEXTURE_2D, 0, 0, 0, 0, 0, 320, 200);
		expect(gl.uniform1i).toHaveBeenCalledWith(expect.objectContaining({ name: 'u_renderTexture' }), 0);
		expect(gl.uniform2f).toHaveBeenCalledWith(expect.objectContaining({ name: 'u_resolution' }), 320, 200);
		expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLE_STRIP, 0, 4);

		hooks.postDraw[0](gl);
		expect(gl.texImage2D).toHaveBeenCalledOnce();
		gl.drawingBufferWidth = 640;
		hooks.postDraw[0](gl);
		expect(gl.texImage2D).toHaveBeenCalledTimes(2);
	});

	it('requires the scene sampler without replacing an active effect on failure', () => {
		const { gl, hooks } = createPluginHost();
		const postProcess = new PostProcess({ gl, hooks });
		postProcess.setEffect({ fragmentShader });
		const activeProgram = gl.createProgram.mock.results[0].value;
		gl.setUniformMissing('u_renderTexture', true);

		expect(() => postProcess.setEffect({ fragmentShader })).toThrow('u_renderTexture');
		gl.useProgram.mockClear();
		hooks.postDraw[0](gl);
		expect(gl.useProgram).toHaveBeenLastCalledWith(activeProgram);
	});

	it('clears, detaches, and releases resources idempotently', () => {
		const { gl, hooks } = createPluginHost();
		const postProcess = new PostProcess({ gl, hooks });
		postProcess.setEffect({ fragmentShader });
		hooks.postDraw[0](gl);

		postProcess.clearEffect();
		gl.copyTexSubImage2D.mockClear();
		hooks.postDraw[0](gl);
		expect(gl.copyTexSubImage2D).not.toHaveBeenCalled();

		postProcess.destroy();
		postProcess.destroy();
		expect(hooks.postDraw).toEqual([]);
		expect(gl.deleteTexture).toHaveBeenCalledOnce();
		expect(gl.deleteBuffer).toHaveBeenCalledOnce();
		expect(gl.deleteVertexArray).toHaveBeenCalledOnce();
	});
});
