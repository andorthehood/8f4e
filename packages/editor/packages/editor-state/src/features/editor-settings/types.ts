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

/**
 * Callback for loading editor settings.
 */
export type LoadEditorSettingsCallback = () => Promise<EditorSettings | null>;

/**
 * Callback for saving editor settings.
 */
export type SaveEditorSettingsCallback = (settings: EditorSettings) => Promise<void>;

/**
 * Callback for getting list of available color schemes.
 */
export type GetListOfColorSchemesCallback = () => Promise<string[]>;

/**
 * Callback for getting a color scheme by name.
 */
export type GetColorSchemeCallback = (name: string) => Promise<ColorScheme>;
