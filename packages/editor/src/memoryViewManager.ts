import type { MemoryViews } from '@8f4e/web-ui';

export interface MemoryRef {
	current: WebAssembly.Memory | ArrayBuffer | SharedArrayBuffer | null;
}

/**
 * Creates memory views and keeps them updated when the underlying buffer identity changes.
 */
export function createMemoryViewManager(memoryRef: MemoryRef): {
	memoryViews: MemoryViews;
	refreshMemoryViews: () => void;
} {
	let cachedBuffer: ArrayBuffer | SharedArrayBuffer | null = null;
	const memoryViews: MemoryViews = {
		int32: new Int32Array(0),
		float32: new Float32Array(0),
	};

	const refreshMemoryViews = () => {
		const memory = memoryRef.current;
		let buffer: ArrayBuffer | SharedArrayBuffer;

		if (!memory) {
			buffer = new ArrayBuffer(0);
		} else if (memory instanceof WebAssembly.Memory) {
			buffer = memory.buffer;
		} else {
			buffer = memory;
		}

		if (buffer !== cachedBuffer) {
			cachedBuffer = buffer;
			memoryViews.int32 = new Int32Array(buffer);
			memoryViews.float32 = new Float32Array(buffer);
		}
	};

	refreshMemoryViews();

	return {
		memoryViews,
		refreshMemoryViews,
	};
}
