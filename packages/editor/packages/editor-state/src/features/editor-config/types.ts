/**
 * Types for editor-config feature.
 */

export interface EditorConfig {
	font: '8x16' | '6x10';
}

export interface EditorConfigBlock {
	code: string[];
	disabled?: boolean;
	gridCoordinates?: {
		x: number;
		y: number;
	};
}
