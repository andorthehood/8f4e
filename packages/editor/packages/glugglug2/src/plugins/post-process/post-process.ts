import type { RenderHook, RenderPluginHost } from '../../types.ts';
import {
	createFullscreenGeometry,
	createProgram,
	deleteFullscreenGeometry,
	FULLSCREEN_VERTEX_SHADER_SOURCE,
	prepareFullscreenPass,
	removeHook,
	requireResource,
} from './fullscreen.ts';

/** Shader sources used by one full-frame post-process effect. */
export type PostProcessEffect = {
	/** Optional custom vertex shader; defaults to the documented fullscreen varying contract. */
	readonly vertexShader?: string;
	/** Fragment shader that samples the completed scene through `u_renderTexture`. */
	readonly fragmentShader: string;
};

/** Captures the completed default framebuffer and applies one optional fullscreen effect. */
export class PostProcess {
	private readonly gl: WebGL2RenderingContext;
	private readonly hooks: RenderPluginHost['hooks'];
	private readonly geometry;
	private readonly startedAt = performance.now();
	private program: WebGLProgram | null = null;
	private renderTextureLocation: WebGLUniformLocation | null = null;
	private timeLocation: WebGLUniformLocation | null = null;
	private resolutionLocation: WebGLUniformLocation | null = null;
	private captureTexture: WebGLTexture | null = null;
	private captureWidth = 0;
	private captureHeight = 0;
	private destroyed = false;

	/** Captures and processes the completed frame from the host's post-draw phase. */
	private readonly drawHook: RenderHook = () => {
		this.draw();
	};

	/**
	 * Creates and attaches an initially inactive post-process plugin.
	 *
	 * Hook insertion order controls which earlier overlays are included in the captured scene.
	 *
	 * @param host - Engine or compatible render-plugin host.
	 */
	constructor(host: RenderPluginHost) {
		this.gl = host.gl;
		this.hooks = host.hooks;
		this.geometry = createFullscreenGeometry(this.gl);
		this.hooks.postDraw.push(this.drawHook);
	}

	/**
	 * Atomically compiles and activates a replacement post-process effect.
	 *
	 * @param effect - Vertex and fragment shader sources for the new effect.
	 */
	setEffect(effect: PostProcessEffect): void {
		const nextProgram = createProgram(
			this.gl,
			effect.vertexShader ?? FULLSCREEN_VERTEX_SHADER_SOURCE,
			effect.fragmentShader,
			'post-process'
		);
		const nextRenderTextureLocation = this.gl.getUniformLocation(nextProgram, 'u_renderTexture');
		if (!nextRenderTextureLocation) {
			this.gl.deleteProgram(nextProgram);
			throw new Error('Could not find the u_renderTexture post-process uniform.');
		}
		const nextTimeLocation = this.gl.getUniformLocation(nextProgram, 'u_time');
		const nextResolutionLocation = this.gl.getUniformLocation(nextProgram, 'u_resolution');
		const previousProgram = this.program;
		this.program = nextProgram;
		this.renderTextureLocation = nextRenderTextureLocation;
		this.timeLocation = nextTimeLocation;
		this.resolutionLocation = nextResolutionLocation;
		if (previousProgram) {
			this.gl.deleteProgram(previousProgram);
		}
	}

	/** Clears the active effect while retaining reusable geometry and capture storage. */
	clearEffect(): void {
		if (this.program) {
			this.gl.deleteProgram(this.program);
			this.program = null;
		}
		this.renderTextureLocation = null;
		this.timeLocation = null;
		this.resolutionLocation = null;
	}

	/** Detaches the hook and releases every WebGL resource owned by this plugin. */
	destroy(): void {
		if (this.destroyed) {
			return;
		}
		this.destroyed = true;
		removeHook(this.hooks.postDraw, this.drawHook);
		this.clearEffect();
		if (this.captureTexture) {
			this.gl.deleteTexture(this.captureTexture);
			this.captureTexture = null;
		}
		deleteFullscreenGeometry(this.gl, this.geometry);
	}

	/** Captures and processes one frame, or exits before all GPU work when inactive. */
	private draw(): void {
		if (!this.program || !this.renderTextureLocation) {
			return;
		}

		const gl = this.gl;
		const width = gl.drawingBufferWidth;
		const height = gl.drawingBufferHeight;
		const captureTexture = this.ensureCaptureTexture(width, height);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, captureTexture);
		gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, width, height);

		prepareFullscreenPass(gl, this.program, this.geometry.vertexArray, false);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, captureTexture);
		gl.uniform1i(this.renderTextureLocation, 0);
		if (this.timeLocation) {
			gl.uniform1f(this.timeLocation, (performance.now() - this.startedAt) / 1_000);
		}
		if (this.resolutionLocation) {
			gl.uniform2f(this.resolutionLocation, width, height);
		}
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	/**
	 * Returns capture storage matching the current drawing-buffer dimensions.
	 *
	 * @param width - Required capture width in pixels.
	 * @param height - Required capture height in pixels.
	 * @returns Reusable texture allocated for the completed scene.
	 */
	private ensureCaptureTexture(width: number, height: number): WebGLTexture {
		const gl = this.gl;
		if (!this.captureTexture) {
			this.captureTexture = requireResource(gl.createTexture(), 'post-process capture texture');
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.captureTexture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		}
		if (width !== this.captureWidth || height !== this.captureHeight) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.captureTexture);
			// The engine requests an opaque default framebuffer (`alpha: false`). Matching its RGB color layout avoids the
			// format incompatibility that WebGL2 reports when copying that framebuffer into RGBA capture storage.
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
			this.captureWidth = width;
			this.captureHeight = height;
		}
		return this.captureTexture;
	}
}
