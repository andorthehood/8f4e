/**
 * Types for project-config feature.
 */

import type { Runtimes } from '../runtime/types';
import type { ColorScheme } from '@8f4e/sprite-generator';

export interface ProjectConfig {
	memorySizeBytes: number;
	runtimeSettings: Runtimes;
	disableAutoCompilation: boolean;
	colorScheme: ColorScheme;
	exportFileName?: string;
	keyCodeMemoryId?: string;
	keyPressedMemoryId?: string;
}
