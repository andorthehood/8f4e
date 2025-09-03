import type { PostProcessEffect, EffectUniforms } from '../types/postProcess';
import createProgram from '../utils/createProgram';
import createShader from '../utils/createShader';

/**
 * Manages post-processing effects with buffer-based uniforms
 */
export class PostProcessManager {
	private gl: WebGL2RenderingContext | WebGLRenderingContext;
	private effects: PostProcessEffect[] = [];
	private programs: Map<string, WebGLProgram> = new Map();
	private uniformLocations: Map<string, Map<string, WebGLUniformLocation>> = new Map();
	private sharedBuffer: Float32Array;
	private bufferSize: number;
	private positionBuffer: WebGLBuffer;

	// Standard uniforms that are always available
	private timeLocation: Map<string, WebGLUniformLocation> = new Map();
	private resolutionLocation: Map<string, WebGLUniformLocation> = new Map();
	private textureLocation: Map<string, WebGLUniformLocation> = new Map();

	// Fallback rendering (simple texture passthrough)
	private fallbackProgram: WebGLProgram | null = null;
	private fallbackTextureLocation: WebGLUniformLocation | null = null;

	constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, bufferSize: number = 256) {
		this.gl = gl;
		this.bufferSize = bufferSize;
		this.sharedBuffer = new Float32Array(bufferSize);

		// Create position buffer for full-screen quad
		this.positionBuffer = this.gl.createBuffer()!;
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
		const quadVertices = new Float32Array([
			-1,
			-1, // bottom-left
			1,
			-1, // bottom-right
			-1,
			1, // top-left
			1,
			1, // top-right
		]);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, quadVertices, this.gl.STATIC_DRAW);
	}

	/**
	 * Add a post-process effect to the pipeline
	 */
	addEffect(effect: PostProcessEffect): void {
		// Compile shaders
		const program = createProgram(this.gl, [
			createShader(this.gl, effect.fragmentShader, this.gl.FRAGMENT_SHADER),
			createShader(this.gl, effect.vertexShader, this.gl.VERTEX_SHADER),
		]);

		this.programs.set(effect.name, program);

		// Get uniform locations
		const uniforms = new Map<string, WebGLUniformLocation>();

		// Standard uniforms
		const timeLocation = this.gl.getUniformLocation(program, 'u_time');
		if (timeLocation) this.timeLocation.set(effect.name, timeLocation);

		const resolutionLocation = this.gl.getUniformLocation(program, 'u_resolution');
		if (resolutionLocation) this.resolutionLocation.set(effect.name, resolutionLocation);

		const textureLocation = this.gl.getUniformLocation(program, 'u_renderTexture');
		if (textureLocation) this.textureLocation.set(effect.name, textureLocation);

		// Custom uniforms from buffer mapping
		if (effect.uniforms) {
			for (const uniformName of Object.keys(effect.uniforms)) {
				const location = this.gl.getUniformLocation(program, uniformName);
				if (location) {
					uniforms.set(uniformName, location);
				}
			}
		}

		this.uniformLocations.set(effect.name, uniforms);
		this.effects.push(effect);
	}

	/**
	 * Update uniform values in the shared buffer
	 */
	updateUniforms(uniforms: EffectUniforms): void {
		for (const [uniformName, value] of Object.entries(uniforms)) {
			// Find which effect uses this uniform
			for (const effect of this.effects) {
				if (effect.uniforms && effect.uniforms[uniformName]) {
					const mapping = effect.uniforms[uniformName];
					if (Array.isArray(value)) {
						// Vector uniform
						for (let i = 0; i < value.length && i < (mapping.size || 1); i++) {
							this.sharedBuffer[mapping.offset + i] = value[i];
						}
					} else {
						// Scalar uniform
						this.sharedBuffer[mapping.offset] = value;
					}
					break;
				}
			}
		}
	}

	/**
	 * Render all enabled effects in sequence, with fallback for no effects
	 */
	render(renderTexture: WebGLTexture, elapsedTime: number, canvasWidth: number, canvasHeight: number): void {
		// Check if any effects are enabled
		const enabledEffects = this.effects.filter(effect => effect.enabled !== false);

		if (enabledEffects.length === 0) {
			// Fallback: render texture directly to canvas without effects
			this.renderFallback(renderTexture);
			return;
		}

		// Bind full-screen quad
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);

		for (const effect of enabledEffects) {
			const program = this.programs.get(effect.name);
			if (!program) continue;

			// Use effect shader
			this.gl.useProgram(program);

			// Bind render texture
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, renderTexture);

			// Set standard uniforms
			const timeLocation = this.timeLocation.get(effect.name);
			if (timeLocation) this.gl.uniform1f(timeLocation, elapsedTime);

			const resolutionLocation = this.resolutionLocation.get(effect.name);
			if (resolutionLocation) this.gl.uniform2f(resolutionLocation, canvasWidth, canvasHeight);

			const textureLocation = this.textureLocation.get(effect.name);
			if (textureLocation) this.gl.uniform1i(textureLocation, 0);

			// Set custom uniforms from buffer
			const uniforms = this.uniformLocations.get(effect.name);
			if (uniforms && effect.uniforms) {
				for (const [uniformName, mapping] of Object.entries(effect.uniforms)) {
					const location = uniforms.get(uniformName);
					if (location) {
						const size = mapping.size || 1;
						const values = this.sharedBuffer.slice(mapping.offset, mapping.offset + size);

						switch (size) {
							case 1:
								this.gl.uniform1f(location, values[0]);
								break;
							case 2:
								this.gl.uniform2f(location, values[0], values[1]);
								break;
							case 3:
								this.gl.uniform3f(location, values[0], values[1], values[2]);
								break;
							case 4:
								this.gl.uniform4f(location, values[0], values[1], values[2], values[3]);
								break;
						}
					}
				}
			}

			// Configure vertex attributes
			const a_position = this.gl.getAttribLocation(program, 'a_position');
			if (a_position !== -1) {
				this.gl.vertexAttribPointer(a_position, 2, this.gl.FLOAT, false, 0, 0);
				this.gl.enableVertexAttribArray(a_position);
			}

			// Render full-screen quad
			this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
		}
	}

	/**
	 * Fallback rendering - simple texture passthrough when no effects are enabled
	 */
	private renderFallback(renderTexture: WebGLTexture): void {
		// Create simple passthrough shaders if not already created
		if (!this.fallbackProgram) {
			this.createFallbackShaders();
		}

		// Bind full-screen quad
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);

		// Use fallback shader
		this.gl.useProgram(this.fallbackProgram!);

		// Bind render texture
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, renderTexture);

		// Set texture uniform
		if (this.fallbackTextureLocation) {
			this.gl.uniform1i(this.fallbackTextureLocation, 0);
		}

		// Configure vertex attributes
		const a_position = this.gl.getAttribLocation(this.fallbackProgram!, 'a_position');
		if (a_position !== -1) {
			this.gl.vertexAttribPointer(a_position, 2, this.gl.FLOAT, false, 0, 0);
			this.gl.enableVertexAttribArray(a_position);
		}

		// Render full-screen quad
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
	}

	/**
	 * Create simple fallback shaders for texture passthrough
	 */
	private createFallbackShaders(): void {
		const fallbackVertexShader = `
			precision mediump float;
			attribute vec2 a_position;
			varying vec2 v_screenCoord;
			
			void main() {
				gl_Position = vec4(a_position, 0, 1);
				v_screenCoord = (a_position + 1.0) / 2.0;
			}
		`;

		const fallbackFragmentShader = `
			precision mediump float;
			varying vec2 v_screenCoord;
			uniform sampler2D u_renderTexture;
			
			void main() {
				gl_FragColor = texture2D(u_renderTexture, v_screenCoord);
			}
		`;

		// Compile fallback shaders
		this.fallbackProgram = createProgram(this.gl, [
			createShader(this.gl, fallbackFragmentShader, this.gl.FRAGMENT_SHADER),
			createShader(this.gl, fallbackVertexShader, this.gl.VERTEX_SHADER),
		]);

		// Get texture uniform location
		this.fallbackTextureLocation = this.gl.getUniformLocation(this.fallbackProgram, 'u_renderTexture');
	}

	/**
	 * Remove an effect from the pipeline
	 */
	removeEffect(name: string): void {
		const program = this.programs.get(name);
		if (program) {
			this.gl.deleteProgram(program);
			this.programs.delete(name);
		}

		this.uniformLocations.delete(name);
		this.timeLocation.delete(name);
		this.resolutionLocation.delete(name);
		this.textureLocation.delete(name);

		this.effects = this.effects.filter(effect => effect.name !== name);
	}

	/**
	 * Enable or disable an effect
	 */
	setEffectEnabled(name: string, enabled: boolean): void {
		const effect = this.effects.find(e => e.name === name);
		if (effect) {
			effect.enabled = enabled;
		}
	}

	/**
	 * Get direct access to the shared buffer for advanced use cases
	 */
	getBuffer(): Float32Array {
		return this.sharedBuffer;
	}

	/**
	 * Clean up resources
	 */
	dispose(): void {
		for (const program of this.programs.values()) {
			this.gl.deleteProgram(program);
		}
		this.programs.clear();
		this.uniformLocations.clear();

		if (this.positionBuffer) {
			this.gl.deleteBuffer(this.positionBuffer);
		}
	}
}
