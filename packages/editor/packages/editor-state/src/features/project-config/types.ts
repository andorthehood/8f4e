/**
 * Types for project-config feature.
 */

import type { Runtimes } from '../runtime/types';

export interface ProjectConfig {
	runtimeSettings: Runtimes;
	disableAutoCompilation: boolean;
	keyCodeMemoryId?: string;
	keyPressedMemoryId?: string;
}
