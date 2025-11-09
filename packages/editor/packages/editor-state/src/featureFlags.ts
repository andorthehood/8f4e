import type { FeatureFlags, FeatureFlagsConfig } from './types';

/**
 * Default feature flags configuration with all features enabled.
 * Users can override these values when initializing the editor.
 */
export const defaultFeatureFlags: FeatureFlags = {
	contextMenu: true,
	infoOverlay: true,
	moduleDragging: true,
	viewportDragging: true,
	viewportAnimations: true,
	persistentStorage: true,
	editing: true,
	demoMode: false,
};

/**
 * Validates feature flags configuration and applies defaults for missing values.
 *
 * @param flags - Partial feature flags configuration
 * @returns Complete feature flags configuration with validated values
 */
export function validateFeatureFlags(flags: FeatureFlagsConfig = {}): FeatureFlags {
	return {
		...defaultFeatureFlags,
		...flags,
	};
}
