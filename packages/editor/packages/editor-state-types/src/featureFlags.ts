/**
 * Feature Flags Configuration System
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
 * Type for partial feature flags used in editor configuration.
 * This allows users to specify only the flags they want to override.
 */
export type FeatureFlagsConfig = Partial<FeatureFlags>;
