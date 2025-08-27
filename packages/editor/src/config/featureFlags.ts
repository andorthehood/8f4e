/**
 * Feature Flags Configuration System
 *
 * This module defines the feature flags interface and default configuration
 * for the editor. Feature flags allow enabling/disabling specific functionality
 * during editor instantiation.
 */

export interface FeatureFlags {
	/** Enable/disable right-click context menu functionality */
	contextMenu: boolean;

	/** Enable/disable info overlay display (development information) */
	infoOverlay: boolean;

	/** Enable/disable dragging and repositioning of code block modules */
	moduleDragging: boolean;

	/** Enable/disable panning/scrolling of the editor viewport */
	viewportDragging: boolean;

	/** Enable/disable persistent storage functionality */
	persistentStorage: boolean;

	/** Enable/disable all editing functionality (create, edit, delete, save) */
	editing: boolean;
}

/**
 * Default feature flags configuration with all features enabled.
 * Users can override these values when initializing the editor.
 */
export const defaultFeatureFlags: FeatureFlags = {
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
export function validateFeatureFlags(flags: Partial<FeatureFlags> = {}): FeatureFlags {
	return {
		...defaultFeatureFlags,
		...flags,
	};
}

/**
 * Type for partial feature flags used in editor configuration.
 * This allows users to specify only the flags they want to override.
 */
export type FeatureFlagsConfig = Partial<FeatureFlags>;
