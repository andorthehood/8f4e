import type { MemoryRef } from '../../src/types';

/**
 * Creates a mock MemoryRef for screenshot tests.
 * The buffer is pre-filled with zeros and has enough capacity for typical test scenarios.
 *
 * @param sizeInBytes Optional size of the memory buffer in bytes (default: 1MB)
 * @returns A MemoryRef object with an initialized ArrayBuffer
 */
export default function createMockMemoryRef(sizeInBytes = 1048576): MemoryRef {
	return {
		current: new ArrayBuffer(sizeInBytes),
	};
}
