import type { MemoryViews } from '../../src/types';

/**
 * Creates mock MemoryViews for screenshot tests.
 *
 * @param sizeInBytes Optional size of the memory buffer in bytes (default: 1MB)
 * @returns MemoryViews with initialized typed array views
 */
export default function createMockMemoryViews(sizeInBytes = 1048576): MemoryViews {
	const buffer = new ArrayBuffer(sizeInBytes);
	return {
		int32: new Int32Array(buffer),
		float32: new Float32Array(buffer),
	};
}
