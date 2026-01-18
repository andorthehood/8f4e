/**
 * Shared types used across multiple features in editor-state.
 * These types do not belong to any single feature and are used by multiple subsystems.
 */

/**
 * Generic size dimensions used across features.
 */
export interface Size {
	width: number;
	height: number;
}

/**
 * Generic x,y position coordinates used across features.
 */
export interface Position {
	x: number;
	y: number;
}

/**
 * Grid coordinates represent logical cell positions in the editor grid.
 * These are distinct from pixel coordinates used at runtime.
 */
export interface GridCoordinates {
	x: number;
	y: number;
}

/**
 * Event dispatcher interface for managing event subscriptions and dispatching.
 * Used throughout the editor for decoupled communication between features.
 */
export interface EventDispatcher {
	on: <T>(eventName: string, callback: (event: T) => void) => void;
	off: <T>(eventName: string, callback: (event: T) => void) => void;
	dispatch: <T>(eventName: string, eventObject?: T) => void;
}

/**
 * Internal mouse event payload for editor mouse interactions.
 */
export interface InternalMouseEvent {
	x: number;
	y: number;
	movementX: number;
	movementY: number;
	buttons: number;
	stopPropagation: boolean;
	canvasWidth: number;
	canvasHeight: number;
}

/**
 * Internal keyboard event payload for editor keyboard interactions.
 */
export interface InternalKeyboardEvent {
	key: string;
	metaKey: boolean;
}
