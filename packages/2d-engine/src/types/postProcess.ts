/**
 * Uniform buffer mapping - maps uniform names to buffer locations
 */
export interface UniformBufferMapping {
	buffer: Float32Array;
	offset: number;
	size?: number; // 1 for float, 2 for vec2, 3 for vec3, 4 for vec4
}

/**
 * Post-process effect definition
 */
export interface PostProcessEffect {
	name: string;
	vertexShader: string;
	fragmentShader: string;
	uniforms?: Record<string, UniformBufferMapping>;
	enabled?: boolean;
}

/**
 * Effect uniform update values
 */
export interface EffectUniforms {
	[key: string]: number | number[];
}

/**
 * Post-process pipeline configuration
 */
export interface PostProcessPipeline {
	effects: PostProcessEffect[];
	sharedBuffer: Float32Array;
	bufferSize: number;
}
