/**
 * Reference holder for WebAssembly memory or ArrayBuffer.
 * The web-ui will read from `current` to create typed array views.
 */
export interface MemoryRef {
	current: WebAssembly.Memory | ArrayBuffer | SharedArrayBuffer;
}

/**
 * Typed array views for reading memory as integers or floats.
 */
export interface MemoryViews {
	int32: Int32Array;
	float32: Float32Array;
}
