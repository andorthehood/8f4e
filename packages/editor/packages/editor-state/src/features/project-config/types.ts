/**
 * Types for project-config feature.
 */

import type { Runtimes } from '../runtime/types';

export interface ConfigBinaryAsset {
	url: string;
	memoryId: string;
}

export interface ProjectConfig {
	memorySizeBytes: number;
	runtimeSettings: Runtimes;
	disableAutoCompilation: boolean;
	binaryAssets: ConfigBinaryAsset[];
	exportFileName?: string;
	keyCodeMemoryId?: string;
	keyPressedMemoryId?: string;
}
