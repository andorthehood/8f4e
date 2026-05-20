import type { DataStructure } from './memory';

export interface CompileOptions {
	startingMemoryWordAddress?: number;
	globalDataStructures?: DataStructure[];
	/**
	 * Ordered custom memory region names. WebAssembly memory index 0 is always the
	 * implicit default memory and is not listed here; custom names map to
	 * indices 1..N by array position.
	 */
	memoryRegions?: string[];
	/** Whether to include AST in compiled modules. Default is false to reduce payload size. */
	includeAST?: boolean;
	/** Disable shared memory for tests (wabt doesn't support shared memory). Default is false (shared enabled). */
	disableSharedMemory?: boolean;
	/** Buffer size for the buffer function. Default is 128. */
	bufferSize?: number;
	/** Buffer generation strategy: 'loop' (default, smaller code size) or 'unrolled' (potentially faster). */
	bufferStrategy?: 'loop' | 'unrolled';
}
