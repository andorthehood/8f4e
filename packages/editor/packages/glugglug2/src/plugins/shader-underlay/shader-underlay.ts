import type { RenderHook, RenderPluginHost } from '../../types.ts';
import {
	createFullscreenGeometry,
	createProgram,
	deleteFullscreenGeometry,
	FULLSCREEN_VERTEX_SHADER_SOURCE,
	prepareFullscreenPass,
	removeHook,
} from './fullscreen.ts';

/** Shader sources used by one fullscreen underlay effect. */
export type ShaderUnderlayEffect = {
	/** Optional custom vertex shader; defaults to the documented fullscreen varying contract. */
	readonly vertexShader?: string;
	/** Fragment shader that produces the underlay color. */
	readonly fragmentShader: string;
};

/** Draws one optional custom shader below every sprite through a pre-draw hook. */
export class ShaderUnderlay {
	private readonly gl: WebGL2RenderingContext;
	private readonly hooks: RenderPluginHost['hooks'];
	private readonly geometry;
	private readonly startedAt = performance.now();
	private program: WebGLProgram | null = null;
	private timeLocation: WebGLUniformLocation | null = null;
	private resolutionLocation: WebGLUniformLocation | null = null;
	private destroyed = false;

	/** Draws the active effect from the host's pre-draw phase. */
	private readonly drawHook: RenderHook = () => {
		this.draw();
	};

	/**
	 * Creates and attaches an initially inactive shader underlay.
	 *
	 * @param host - Engine or compatible render-plugin host.
	 */
	constructor(host: RenderPluginHost) {
		this.gl = host.gl;
		this.hooks = host.hooks;
		this.geometry = createFullscreenGeometry(this.gl);
		this.hooks.preDraw.push(this.drawHook);
	}

	/**
	 * Atomically compiles and activates a replacement effect.
	 *
	 * @param effect - Vertex and fragment shader sources for the new underlay.
	 */
	setEffect(effect: ShaderUnderlayEffect): void {
		const nextProgram = createProgram(
			this.gl,
			effect.vertexShader ?? FULLSCREEN_VERTEX_SHADER_SOURCE,
			effect.fragmentShader,
			'shader underlay'
		);
		const nextTimeLocation = this.gl.getUniformLocation(nextProgram, 'u_time');
		const nextResolutionLocation = this.gl.getUniformLocation(nextProgram, 'u_resolution');
		const previousProgram = this.program;
		this.program = nextProgram;
		this.timeLocation = nextTimeLocation;
		this.resolutionLocation = nextResolutionLocation;
		if (previousProgram) {
			this.gl.deleteProgram(previousProgram);
		}
	}

	/** Clears the active effect while retaining reusable fullscreen geometry. */
	clearEffect(): void {
		if (this.program) {
			this.gl.deleteProgram(this.program);
			this.program = null;
		}
		this.timeLocation = null;
		this.resolutionLocation = null;
	}

	/** Detaches the hook and releases every WebGL resource owned by this plugin. */
	destroy(): void {
		if (this.destroyed) {
			return;
		}
		this.destroyed = true;
		removeHook(this.hooks.preDraw, this.drawHook);
		this.clearEffect();
		deleteFullscreenGeometry(this.gl, this.geometry);
	}

	/** Draws the active effect once, or exits immediately when no effect is set. */
	private draw(): void {
		if (!this.program) {
			return;
		}
		const gl = this.gl;
		prepareFullscreenPass(gl, this.program, this.geometry.vertexArray, false);
		if (this.timeLocation) {
			gl.uniform1f(this.timeLocation, (performance.now() - this.startedAt) / 1_000);
		}
		if (this.resolutionLocation) {
			gl.uniform2f(this.resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);
		}
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
}
