import { describe, expect, it } from 'vitest';

import { createPluginHost } from '../__tests__/fake-webgl.ts';
import { ShaderUnderlay } from './shader-underlay.ts';

const fragmentShader = `#version 300 es
	precision mediump float;
	uniform float u_time;
	uniform vec2 u_resolution;
	out vec4 outColor;
	void main() { outColor = vec4(u_time / max(u_resolution.x, 1.0)); }
`;

describe('ShaderUnderlay', () => {
	it('runs only while an effect is active and supplies standard uniforms', () => {
		const { gl, hooks } = createPluginHost();
		const underlay = new ShaderUnderlay({ gl, hooks });
		expect(hooks.preDraw).toHaveLength(1);

		hooks.preDraw[0](gl);
		expect(gl.drawArrays).not.toHaveBeenCalled();

		underlay.setEffect({ fragmentShader });
		hooks.preDraw[0](gl);
		expect(gl.uniform1f).toHaveBeenCalledOnce();
		expect(gl.uniform2f).toHaveBeenCalledWith(expect.objectContaining({ name: 'u_resolution' }), 320, 200);
		expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLE_STRIP, 0, 4);

		underlay.clearEffect();
		gl.drawArrays.mockClear();
		hooks.preDraw[0](gl);
		expect(gl.drawArrays).not.toHaveBeenCalled();
	});

	it('preserves the active effect when replacement compilation fails', () => {
		const { gl, hooks } = createPluginHost();
		const underlay = new ShaderUnderlay({ gl, hooks });
		underlay.setEffect({ fragmentShader });
		const activeProgram = gl.createProgram.mock.results[0].value;
		gl.setShaderCompilationSucceeds(false);

		expect(() => underlay.setEffect({ fragmentShader: 'invalid' })).toThrow('shader compilation failed');
		gl.useProgram.mockClear();
		hooks.preDraw[0](gl);
		expect(gl.useProgram).toHaveBeenLastCalledWith(activeProgram);
	});

	it('detaches and releases its resources idempotently', () => {
		const { gl, hooks } = createPluginHost();
		const underlay = new ShaderUnderlay({ gl, hooks });
		underlay.setEffect({ fragmentShader });

		underlay.destroy();
		underlay.destroy();

		expect(hooks.preDraw).toEqual([]);
		expect(gl.deleteProgram).toHaveBeenCalledOnce();
		expect(gl.deleteBuffer).toHaveBeenCalledOnce();
		expect(gl.deleteVertexArray).toHaveBeenCalledOnce();
	});
});
