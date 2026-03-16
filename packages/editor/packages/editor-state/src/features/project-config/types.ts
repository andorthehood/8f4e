/**
 * Types for project-config feature.
 */

import type { Runtimes } from '../runtime/types';

export interface ProjectConfig {
	memorySizeBytes: number;
	runtimeSettings: Runtimes;
	disableAutoCompilation: boolean;
	keyCodeMemoryId?: string;
	keyPressedMemoryId?: string;
}
