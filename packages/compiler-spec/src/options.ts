import type { DataStructure } from './memory';

/** Optional settings that control compiler layout and emitted metadata. */
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
	/** Whether to include per-instruction stack analysis in compiled modules and functions. Default is false. */
	includeStackAnalysis?: boolean;
	/** Disable shared memory for tests (wabt doesn't support shared memory). Default is false (shared enabled). */
	disableSharedMemory?: boolean;
}
