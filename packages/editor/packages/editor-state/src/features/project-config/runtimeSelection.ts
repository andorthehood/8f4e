import { createDefaultProjectConfig } from './defaults';

import type { ProjectConfig } from './types';
import type { RuntimeRegistry } from '../runtime/types';

export function getResolvedRuntimeId(
	requestedRuntimeId: string | undefined,
	runtimeRegistry: RuntimeRegistry,
	defaultRuntimeId: string
): string {
	if (requestedRuntimeId && requestedRuntimeId in runtimeRegistry) {
		return requestedRuntimeId;
	}

	return defaultRuntimeId;
}

export function getDefaultProjectConfigForRuntime(
	runtimeId: string,
	runtimeRegistry: RuntimeRegistry,
	defaultRuntimeId: string
): ProjectConfig {
	const resolvedRuntimeId = getResolvedRuntimeId(runtimeId, runtimeRegistry, defaultRuntimeId);
	const runtimeSettings = runtimeRegistry[resolvedRuntimeId]?.defaults ?? runtimeRegistry[defaultRuntimeId].defaults;

	return createDefaultProjectConfig(runtimeSettings as unknown as ProjectConfig['runtimeSettings']);
}
