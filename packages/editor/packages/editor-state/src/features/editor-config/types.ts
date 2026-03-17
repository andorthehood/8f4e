/**
 * Types for editor-config feature.
 */

export type EditorConfig = Record<never, never>;

export interface EditorConfigBlock {
	code: string[];
	disabled?: boolean;
	gridCoordinates?: {
		x: number;
		y: number;
	};
}
