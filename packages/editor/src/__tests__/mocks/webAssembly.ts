/**
 * Mock implementations for WebAssembly-related objects
 */

/**
 * Create a mock WebAssembly.Memory with configurable buffer size
 */
export function createMockWebAssemblyMemory(initialPages: number = 1): WebAssembly.Memory {
	const pageSize = 65536; // 64KB per page
	const buffer = new ArrayBuffer(initialPages * pageSize);
	
	const mockMemory = {
		buffer,
		grow: jest.fn((delta: number) => {
			// Mock implementation that returns the previous size in pages
			return initialPages;
		}),
	} as WebAssembly.Memory;

	return mockMemory;
}

/**
 * Create mock data views for WebAssembly memory testing
 */
export function createMockMemoryViews(memory: WebAssembly.Memory) {
	return {
		dataView: new DataView(memory.buffer),
		int32Array: new Int32Array(memory.buffer),
		float32Array: new Float32Array(memory.buffer),
		uint8Array: new Uint8Array(memory.buffer),
	};
}

/**
 * Create a mock WebAssembly.Instance for testing
 */
export function createMockWebAssemblyInstance(): WebAssembly.Instance {
	return {
		exports: {
			// Common WASM exports that might be used in tests
			main: jest.fn(),
			memory: createMockWebAssemblyMemory(),
		},
	} as unknown as WebAssembly.Instance;
}

/**
 * Create mock WASM bytecode for testing
 */
export function createMockWasmBytecode(size: number = 100): Uint8Array {
	const bytecode = new Uint8Array(size);
	// Fill with some recognizable pattern for debugging
	for (let i = 0; i < size; i++) {
		bytecode[i] = (i % 256);
	}
	return bytecode;
}

/**
 * Create mock compiled modules map
 */
export function createMockCompiledModulesMap() {
	return new Map([
		['testModule1', {
			memoryBuffer: new Int32Array([1, 2, 3]),
			memoryBufferFloat: new Float32Array([1.0, 2.0, 3.0]),
		}],
		['testModule2', {
			memoryBuffer: new Int32Array([4, 5, 6]),
			memoryBufferFloat: new Float32Array([4.0, 5.0, 6.0]),
		}],
	]);
}