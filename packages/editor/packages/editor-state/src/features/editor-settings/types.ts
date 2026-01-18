/**
 * Types for editor-settings feature - user preferences and configuration.
 */

import type { Font, ColorScheme } from '@8f4e/sprite-generator';

/**
 * Editor settings for user preferences.
 */
export interface EditorSettings {
	colorScheme: string;
	font: Font;
}
