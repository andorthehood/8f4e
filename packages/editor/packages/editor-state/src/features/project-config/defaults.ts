import type { ProjectConfig } from './types';
import type { Runtimes } from '../runtime/types';

export function createDefaultProjectConfig(runtimeSettings: Runtimes): ProjectConfig {
	return runtimeSettings;
}
