/**
 * Feature Flags Configuration System
 *
 * This module defines the feature flags interface and default configuration
 * for the editor. Feature flags allow enabling/disabling specific functionality
 * during editor instantiation.
 */

// Re-export types from shared package
export type { FeatureFlags, FeatureFlagsConfig } from '@8f4e/editor-state-types';

/**
 * Default feature flags configuration with all features enabled.
 * Users can override these values when initializing the editor.
 */
export const defaultFeatureFlags = {
	contextMenu: true,
	infoOverlay: true, // Default to true, can be overridden
	moduleDragging: true,
	viewportDragging: true,
	persistentStorage: true,
	editing: true,
};

/**
 * Validates feature flags configuration and applies defaults for missing values.
 *
 * @param flags - Partial feature flags configuration
 * @returns Complete feature flags configuration with validated values
 */
export function validateFeatureFlags(
	flags: Partial<import('@8f4e/editor-state-types').FeatureFlags> = {}
): import('@8f4e/editor-state-types').FeatureFlags {
	return {
		...defaultFeatureFlags,
		...flags,
	};
}
