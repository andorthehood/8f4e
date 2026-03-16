/**
 * Types for project-config feature.
 */

import type { Runtimes } from '../runtime/types';

export interface ProjectConfig {
	/**
	 * Memory size in bytes (optional).
	 * When omitted, memory size is automatically derived from the program's static footprint.
	 */
	memorySizeBytes?: number;
	runtimeSettings: Runtimes;
	disableAutoCompilation: boolean;
	keyCodeMemoryId?: string;
	keyPressedMemoryId?: string;
}
