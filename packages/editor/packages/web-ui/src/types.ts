/**
 * Reference holder for WebAssembly memory or ArrayBuffer.
 * The web-ui will read from `current` to create typed array views.
 */
export interface MemoryRef {
	current: WebAssembly.Memory | ArrayBuffer | SharedArrayBuffer | null;
}

/**
 * Typed array views for reading memory as integers or floats.
 */
export interface MemoryViews {
	int32: Int32Array;
	float32: Float32Array;
}

/**
 * Creates a helper that manages memory views and recreates them only when the buffer identity changes.
 * This is important for WebAssembly.Memory which can grow and swap its underlying buffer.
 */
export function createMemoryViewManager(memoryRef: MemoryRef): () => MemoryViews {
	let cachedBuffer: ArrayBuffer | SharedArrayBuffer | null = null;
	let cachedViews: MemoryViews | null = null;

	return function getMemoryViews(): MemoryViews {
		// Get the current buffer from the memory ref
		const memory = memoryRef.current;
		let buffer: ArrayBuffer | SharedArrayBuffer;

		if (!memory) {
			// No memory available - return empty views
			buffer = new ArrayBuffer(0);
		} else if (memory instanceof WebAssembly.Memory) {
			buffer = memory.buffer;
		} else {
			buffer = memory;
		}

		// Only recreate views if the buffer identity has changed
		if (buffer !== cachedBuffer) {
			cachedBuffer = buffer;
			cachedViews = {
				int32: new Int32Array(buffer),
				float32: new Float32Array(buffer),
			};
		}

		return cachedViews!;
	};
}
